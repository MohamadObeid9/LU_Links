import { describe, it, expect, beforeEach } from "vitest";
import { _saveCache, _loadCache, _clearCache } from "./cache.js";
import { esc } from "./ui.js";

describe("cache", () => {
  beforeEach(async () => {
    localStorage.clear();
    await _clearCache();
  });

  it("saves and loads payload", async () => {
    await _saveCache({ programs: [{ id: 1 }] }, { key: "hierarchy", etag: '"abc"' });
    const loaded = await _loadCache("hierarchy");
    expect(loaded).not.toBeNull();
    expect(loaded.data.programs[0].id).toBe(1);
    expect(loaded.etag).toBe('"abc"');
    expect(loaded.stale).toBe(false);
  });

  it("returns null when empty", async () => {
    expect(await _loadCache("hierarchy")).toBeNull();
  });

  it("clears stored entries", async () => {
    await _saveCache({ ok: true }, { key: "hierarchy" });
    await _clearCache();
    expect(await _loadCache("hierarchy")).toBeNull();
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
