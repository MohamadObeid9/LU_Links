//go:build integration

package integration

import (
	"context"
	"encoding/json"
	"testing"

	"lu-links/internal/errs"
	"lu-links/internal/models"
)

func TestRepoUserGuestClaimAndCredentials(t *testing.T) {
	dbClient := openTestDB(t)
	resetDB(t, dbClient.DB)

	repo := newUserRepo(t, dbClient.DB)
	ctx := context.Background()

	guestID, err := repo.CreateGuest(ctx)
	if err != nil {
		t.Fatalf("CreateGuest: %v", err)
	}

	user, err := repo.ClaimGuest(ctx, guestID, models.User{
		FirstName: "ali",
		LastName:  "hassan",
		Number:    42,
	})
	if err != nil {
		t.Fatalf("ClaimGuest: %v", err)
	}
	if user.IsGuest {
		t.Fatal("claimed user should not be guest")
	}
	if user.ID != guestID {
		t.Fatalf("claim should keep id: got %d want %d", user.ID, guestID)
	}

	found, err := repo.GetByCredentials(ctx, models.User{
		FirstName: "ali",
		LastName:  "hassan",
		Number:    42,
	})
	if err != nil {
		t.Fatalf("GetByCredentials: %v", err)
	}
	if found.Handle != "ali_hassan_42" {
		t.Fatalf("handle: got %q want ali_hassan_42", found.Handle)
	}

	_, err = repo.ClaimGuest(ctx, guestID, models.User{
		FirstName: "other",
		LastName:  "person",
		Number:    1,
	})
	if err == nil {
		t.Fatal("expected error claiming already-registered row")
	}
	if err != errs.ErrUserGuestNotFound {
		t.Fatalf("re-claim error: got %v want ErrUserGuestNotFound", err)
	}
}

func TestRepoContentGetReturnsJSON(t *testing.T) {
	dbClient := openTestDB(t)
	resetDB(t, dbClient.DB)

	repo := newContentRepo(t, dbClient.DB)
	raw, err := repo.Get(context.Background())
	if err != nil {
		t.Fatalf("Get content: %v", err)
	}

	var payload map[string]json.RawMessage
	if err := json.Unmarshal(raw, &payload); err != nil {
		t.Fatalf("content is not valid JSON: %v", err)
	}
	for _, key := range []string{"faculties", "branches", "years", "courses", "links"} {
		if _, ok := payload[key]; !ok {
			t.Fatalf("content JSON missing key %q", key)
		}
	}
}
