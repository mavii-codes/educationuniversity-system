import { afterEach, describe, expect, it, vi } from "vitest";
import { getCoverUrl } from "./getCover";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("getCoverUrl", () => {
  it("normalizes the ISBN and returns a verified Open Library URL", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      getCoverUrl({ isbn: "978-013 4685991", title: "Effective Java" })
    ).resolves.toBe(
      "https://covers.openlibrary.org/b/isbn/9780134685991-L.jpg"
    );
    expect(fetchMock).toHaveBeenCalledWith(
      "https://covers.openlibrary.org/b/isbn/9780134685991-L.jpg?default=false",
      expect.objectContaining({ method: "HEAD" })
    );
  });

  it("falls back to Google Books and upgrades thumbnail URLs to HTTPS", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({ ok: false })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ docs: [] }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          items: [
            {
              volumeInfo: {
                imageLinks: { thumbnail: "http://books.google.com/cover.jpg" },
              },
            },
          ],
        }),
      });
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      getCoverUrl({
        isbn: "978-0134685991",
        title: "Effective Java",
        author: "Joshua Bloch",
      })
    ).resolves.toBe("https://books.google.com/cover.jpg"    );

    const titleSearch = new URL(String(fetchMock.mock.calls[3][0]));
    expect(titleSearch.searchParams.get("q")).toBe(
      "intitle:Effective Java inauthor:Joshua Bloch"
    );
  });

  it("uses an Open Library title match when ISBN lookup has no cover", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          docs: [
            {
              cover_i: 8605114,
              author_name: ["Robert C. Martin"],
            },
          ],
        }),
      });
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      getCoverUrl({
        title: "Clean Architecture: A Craftsman's Guide",
        author: "Robert C. Martin",
      })
    ).resolves.toBe("https://covers.openlibrary.org/b/id/8605114-L.jpg");
    const titleSearch = new URL(String(fetchMock.mock.calls[0][0]));
    expect(titleSearch.hostname).toBe("openlibrary.org");
  });

  it("returns null when the lookup fails", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network error")));

    await expect(getCoverUrl({ isbn: "978-0134685991" })).resolves.toBeNull();
  });
});
