package service

import (
	"context"
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"sync"
	"time"

	"lu-links/internal/repository"

	"golang.org/x/sync/singleflight"
)

const contentCacheTTL = 60 * time.Second

type contentCacheEntry struct {
	body []byte
	etag string
	exp  time.Time
}

type ContentService struct {
	repo repository.ContentRepository
	ttl  time.Duration
	now  func() time.Time

	mu         sync.RWMutex
	full       contentCacheEntry
	hierarchy  contentCacheEntry
	offerings  map[int]contentCacheEntry
	gen        uint64
	group      singleflight.Group
}

func NewContentService(repo repository.ContentRepository) *ContentService {
	return &ContentService{
		repo:      repo,
		ttl:       contentCacheTTL,
		now:       time.Now,
		offerings: make(map[int]contentCacheEntry),
	}
}

func contentETag(body []byte) string {
	sum := sha256.Sum256(body)
	return `"` + hex.EncodeToString(sum[:16]) + `"`
}

// Get returns the public navigation JSON, serving a process-local copy when
// it is still within TTL. Concurrent misses share one Postgres round-trip.
func (c *ContentService) Get(ctx context.Context) ([]byte, error) {
	body, _, err := c.GetWithETag(ctx, "")
	return body, err
}

// GetWithETag returns body and ETag. If ifNoneMatch matches, body is nil and
// notModified is true (caller should send 304).
func (c *ContentService) GetWithETag(ctx context.Context, ifNoneMatch string) (body []byte, etag string, err error) {
	if e, ok := c.snapshotFull(); ok {
		if ifNoneMatch != "" && ifNoneMatch == e.etag {
			return nil, e.etag, nil
		}
		return e.body, e.etag, nil
	}

	v, err, _ := c.group.Do("content", func() (any, error) {
		if e, ok := c.snapshotFull(); ok {
			return e, nil
		}
		c.mu.RLock()
		gen := c.gen
		c.mu.RUnlock()

		result, err := c.repo.Get(ctx)
		if err != nil {
			return nil, fmt.Errorf("get content: %w", err)
		}
		entry := contentCacheEntry{
			body: append([]byte(nil), result...),
			etag: contentETag(result),
			exp:  c.now().Add(c.ttl),
		}
		c.mu.Lock()
		if c.gen == gen {
			c.full = entry
		}
		c.mu.Unlock()
		return entry, nil
	})
	if err != nil {
		return nil, "", err
	}
	entry := v.(contentCacheEntry)
	if ifNoneMatch != "" && ifNoneMatch == entry.etag {
		return nil, entry.etag, nil
	}
	return entry.body, entry.etag, nil
}

// GetHierarchy returns faculties→years/semesters + extras, without courses/links.
func (c *ContentService) GetHierarchy(ctx context.Context, ifNoneMatch string) (body []byte, etag string, err error) {
	if e, ok := c.snapshotHierarchy(); ok {
		if ifNoneMatch != "" && ifNoneMatch == e.etag {
			return nil, e.etag, nil
		}
		return e.body, e.etag, nil
	}

	v, err, _ := c.group.Do("hierarchy", func() (any, error) {
		if e, ok := c.snapshotHierarchy(); ok {
			return e, nil
		}
		c.mu.RLock()
		gen := c.gen
		c.mu.RUnlock()

		result, err := c.repo.GetHierarchy(ctx)
		if err != nil {
			return nil, fmt.Errorf("get hierarchy: %w", err)
		}
		entry := contentCacheEntry{
			body: append([]byte(nil), result...),
			etag: contentETag(result),
			exp:  c.now().Add(c.ttl),
		}
		c.mu.Lock()
		if c.gen == gen {
			c.hierarchy = entry
		}
		c.mu.Unlock()
		return entry, nil
	})
	if err != nil {
		return nil, "", err
	}
	entry := v.(contentCacheEntry)
	if ifNoneMatch != "" && ifNoneMatch == entry.etag {
		return nil, entry.etag, nil
	}
	return entry.body, entry.etag, nil
}

// GetOffering returns years/semesters/courses/links for one branch_specialisation.
func (c *ContentService) GetOffering(ctx context.Context, offeringID int, ifNoneMatch string) (body []byte, etag string, err error) {
	if offeringID <= 0 {
		return nil, "", fmt.Errorf("invalid offering id")
	}
	if e, ok := c.snapshotOffering(offeringID); ok {
		if ifNoneMatch != "" && ifNoneMatch == e.etag {
			return nil, e.etag, nil
		}
		return e.body, e.etag, nil
	}

	key := fmt.Sprintf("offering:%d", offeringID)
	v, err, _ := c.group.Do(key, func() (any, error) {
		if e, ok := c.snapshotOffering(offeringID); ok {
			return e, nil
		}
		c.mu.RLock()
		gen := c.gen
		c.mu.RUnlock()

		result, err := c.repo.GetOffering(ctx, offeringID)
		if err != nil {
			return nil, fmt.Errorf("get offering: %w", err)
		}
		entry := contentCacheEntry{
			body: append([]byte(nil), result...),
			etag: contentETag(result),
			exp:  c.now().Add(c.ttl),
		}
		c.mu.Lock()
		if c.gen == gen {
			c.offerings[offeringID] = entry
		}
		c.mu.Unlock()
		return entry, nil
	})
	if err != nil {
		return nil, "", err
	}
	entry := v.(contentCacheEntry)
	if ifNoneMatch != "" && ifNoneMatch == entry.etag {
		return nil, entry.etag, nil
	}
	return entry.body, entry.etag, nil
}

func (c *ContentService) Search(ctx context.Context, q string, limit int) ([]byte, error) {
	result, err := c.repo.Search(ctx, q, limit)
	if err != nil {
		return nil, fmt.Errorf("search content: %w", err)
	}
	return result, nil
}

func (c *ContentService) GetCoursesByIDs(ctx context.Context, ids []int) ([]byte, error) {
	result, err := c.repo.GetCoursesByIDs(ctx, ids)
	if err != nil {
		return nil, fmt.Errorf("get courses by ids: %w", err)
	}
	return result, nil
}

// GetUncached always hits Postgres and does not read or write the student cache.
func (c *ContentService) GetUncached(ctx context.Context) ([]byte, error) {
	result, err := c.repo.Get(ctx)
	if err != nil {
		return nil, fmt.Errorf("get content: %w", err)
	}
	return result, nil
}

// Invalidate drops the student cache so the next Get refills from Postgres.
func (c *ContentService) Invalidate() {
	c.mu.Lock()
	c.full = contentCacheEntry{}
	c.hierarchy = contentCacheEntry{}
	c.offerings = make(map[int]contentCacheEntry)
	c.gen++
	c.mu.Unlock()
}

func (c *ContentService) snapshotFull() (contentCacheEntry, bool) {
	c.mu.RLock()
	defer c.mu.RUnlock()
	if c.full.body == nil || !c.now().Before(c.full.exp) {
		return contentCacheEntry{}, false
	}
	return c.full, true
}

func (c *ContentService) snapshotHierarchy() (contentCacheEntry, bool) {
	c.mu.RLock()
	defer c.mu.RUnlock()
	if c.hierarchy.body == nil || !c.now().Before(c.hierarchy.exp) {
		return contentCacheEntry{}, false
	}
	return c.hierarchy, true
}

func (c *ContentService) snapshotOffering(id int) (contentCacheEntry, bool) {
	c.mu.RLock()
	defer c.mu.RUnlock()
	e, ok := c.offerings[id]
	if !ok || e.body == nil || !c.now().Before(e.exp) {
		return contentCacheEntry{}, false
	}
	return e, true
}
