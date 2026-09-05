import { describe, it, expect, beforeEach } from "vitest";
import { _saveCache, _loadCache, _clearCache } from "./cache.js";
import { esc } from "./ui.js";

describe("cache", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("saves and loads payload", () => {
    _saveCache({ programs: [{ id: 1 }] });
    const loaded = _loadCache();
    expect(loaded).not.toBeNull();
    expect(loaded.data.programs[0].id).toBe(1);
    expect(loaded.stale).toBe(false);
  });

  it("returns null when empty", () => {
    expect(_loadCache()).toBeNull();
  });

  it("clears stored entries", () => {
    _saveCache({ ok: true });
    _clearCache();
    expect(_loadCache()).toBeNull();
  });
});

describe("esc", () => {
  it("escapes HTML special characters", () => {
    expect(esc(`<img src="x" onerror='alert(1)'>`)).toBe(
      "&lt;img src=&quot;x&quot; onerror=&#039;alert(1)&#039;&gt;",
    );
  });

  it("returns empty string for falsy input", () => {
    expect(esc("")).toBe("");
    expect(esc(null)).toBe("");
  });
});
