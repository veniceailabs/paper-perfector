import type { ScholarResult } from "../models/Scholar";

type OpenAlexAuthor = {
  author?: {
    display_name?: string;
  };
};

type OpenAlexWork = {
  id?: string;
  display_name?: string;
  publication_year?: number;
  primary_location?: {
    landing_page_url?: string;
    pdf_url?: string | null;
    source?: {
      display_name?: string;
    };
  };
  open_access?: {
    oa_url?: string;
  };
  authorships?: OpenAlexAuthor[];
  abstract_inverted_index?: Record<string, number[]>;
};

type OpenAlexResponse = {
  results?: OpenAlexWork[];
};

function decodeAbstract(invertedIndex?: Record<string, number[]>) {
  if (!invertedIndex) {
    return undefined;
  }

  const positions: string[] = [];
  Object.entries(invertedIndex).forEach(([word, indexes]) => {
    indexes.forEach((index) => {
      positions[index] = word;
    });
  });

  const text = positions.filter(Boolean).join(" ");
  return text || undefined;
}

function mapWork(work: OpenAlexWork): ScholarResult {
  return {
    id: work.id ?? crypto.randomUUID(),
    title: work.display_name ?? "Untitled",
    authors:
      work.authorships
        ?.map((author) => author.author?.display_name)
        .filter((name): name is string => Boolean(name)) ?? [],
    year: work.publication_year,
    venue: work.primary_location?.source?.display_name,
    url: work.primary_location?.landing_page_url,
    pdfUrl: work.open_access?.oa_url ?? work.primary_location?.pdf_url ?? undefined,
    abstract: decodeAbstract(work.abstract_inverted_index),
  };
}

export async function fetchScholarResults(query: string) {
  const params = new URLSearchParams({
    search: query,
    "per-page": "8",
    select:
      "id,display_name,publication_year,primary_location,open_access,authorships,abstract_inverted_index",
  });

  const response = await fetch(`https://api.openalex.org/works?${params.toString()}`);
  if (!response.ok) {
    throw new Error("Scholar search failed.");
  }
  const data = (await response.json()) as OpenAlexResponse;
  return (data.results ?? []).map(mapWork);
}
