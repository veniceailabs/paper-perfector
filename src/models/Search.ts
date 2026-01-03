export type SearchScope = {
  title: boolean;
  body: boolean;
  metadata: boolean;
};

export const defaultSearchScope: SearchScope = {
  title: true,
  body: true,
  metadata: false,
};

export type SearchResult = {
  sectionId: string;
  title: string;
  snippet: string;
  matchType: "title" | "body" | "metadata";
};
