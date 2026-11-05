export interface CoverLookupInput {
  isbn?: string | null;
  title?: string | null;
  author?: string | null;
}

const LOOKUP_TIMEOUT_MS = 5000;

export async function getCoverUrl({
  isbn,
  title,
  author,
}: CoverLookupInput): Promise<string | null> {
  const cleanIsbn = isbn?.replace(/[-\s]/g, "") ?? "";
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), LOOKUP_TIMEOUT_MS);

  try {
    if (cleanIsbn) {
      try {
        const coverUrl = `https://covers.openlibrary.org/b/isbn/${encodeURIComponent(cleanIsbn)}-L.jpg`;
        const response = await fetch(`${coverUrl}?default=false`, {
          method: "HEAD",
          signal: controller.signal,
        });
        if (response.ok) return coverUrl;
      } catch {
        if (controller.signal.aborted) return null;
      }

      try {
        const byIsbn = await getGoogleBooksCover(
          `isbn:${cleanIsbn}`,
          controller.signal
        );
        if (byIsbn) return byIsbn;
      } catch {
        if (controller.signal.aborted) return null;
      }
    }

    if (title?.trim()) {
      try {
        const openLibraryCover = await getOpenLibraryCover(
          title,
          author,
          controller.signal
        );
        if (openLibraryCover) return openLibraryCover;
      } catch {
        if (controller.signal.aborted) return null;
      }

      const query = `intitle:${title.trim()}${author?.trim() ? ` inauthor:${author.trim()}` : ""}`;
      return await getGoogleBooksCover(query, controller.signal);
    }

    return null;
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

async function getOpenLibraryCover(
  title: string,
  author: string | null | undefined,
  signal: AbortSignal
): Promise<string | null> {
  const url = new URL("https://openlibrary.org/search.json");
  const searchableTitle = title
    .replace(/\s*\((?:\d+(?:st|nd|rd|th)\s+)?edition[^)]*\)/gi, "")
    .trim();
  url.searchParams.set(
    "q",
    `${searchableTitle} ${author?.trim() ?? ""}`.trim()
  );
  url.searchParams.set("limit", "5");
  url.searchParams.set("fields", "cover_i,title,author_name");

  const response = await fetch(url, { signal });
  if (!response.ok) return null;

  const data = (await response.json()) as {
    docs?: Array<{
      cover_i?: number;
      author_name?: string[];
    }>;
  };
  const documents = data.docs ?? [];
  const authorQuery = author?.trim().toLowerCase();
  const match =
    (authorQuery &&
      documents.find(
        (document) =>
          document.cover_i &&
          document.author_name?.some((name) =>
            name.toLowerCase().includes(authorQuery)
          )
      )) ||
    documents.find((document) => document.cover_i);

  return match?.cover_i
    ? `https://covers.openlibrary.org/b/id/${match.cover_i}-L.jpg`
    : null;
}

async function getGoogleBooksCover(
  query: string,
  signal: AbortSignal
): Promise<string | null> {
  const url = new URL("https://www.googleapis.com/books/v1/volumes");
  url.searchParams.set("q", query);
  url.searchParams.set("maxResults", "1");

  const response = await fetch(url, { signal });
  if (!response.ok) return null;

  const data = (await response.json()) as {
    items?: Array<{
      volumeInfo?: {
        imageLinks?: { thumbnail?: string };
      };
    }>;
  };
  const thumbnail = data.items?.[0]?.volumeInfo?.imageLinks?.thumbnail;
  return thumbnail ? thumbnail.replace(/^http:/i, "https:") : null;
}
