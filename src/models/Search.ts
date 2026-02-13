export type SearchScope = {
  title: boolean;
  body: boolean;
  metadata: boolean;
};

export type SearchOptions = {
  matchCase: boolean;
  wholeWord: boolean;
};

export const defaultSearchScope: SearchScope = {
  title: true,
  body: true,
  metadata: false,
};

export const defaultSearchOptions: SearchOptions = {
  matchCase: false,
  wholeWord: false,
};

export type SearchResult = {
  sectionId: string;
  title: string;
  snippet: string;
  matchType: "title" | "body" | "metadata";
};
