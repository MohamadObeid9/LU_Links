package api

import (
	"net/http"
)

// handleAgentsIndex serves /.well-known/agents-index.json — org-level DNS-AID /
// ANS-style directory listing A2A + MCP agents and their well-known cards.
func (h *Handler) handleAgentsIndex(w http.ResponseWriter, r *http.Request) {
	base := h.baseURL()
	doc := map[string]any{
		"origin":  "lu-links.onrender.com",
		"version": "1.0",
		"organization": map[string]any{
			"name": "LU Links",
			"url":  base + "/",
		},
		"agents": map[string]any{
			"lu-links": map[string]any{
				"location": map[string]any{
					"fqdn":     "lu-links.onrender.com",
					"endpoint": h.absURL("/api"),
					"wellKnown": map[string]any{
						"a2a": h.absURL("/.well-known/agent-card.json"),
						"mcp": h.absURL("/.well-known/mcp/server-card.json"),
					},
				},
				"model-card": map[string]any{
					"description": "Lebanese University course materials hub — browse courses, open shared links, and submit reports or contributions via a JSON HTTP API.",
					"version":     "1.0.0",
					"provider":    "LU Links",
				},
				"capability": map[string]any{
					"protocols": []string{"a2a", "mcp"},
				},
				"status": "ACTIVE",
			},
		},
	}
	writeDiscoveryJSON(w, doc)
}
