export type Section = {
  id: string;
  level: 1 | 2 | 3;
  title: string;
  body: string[];
  monoBlocks?: string[];
};

export type Document = {
  title: string;
  subtitle?: string;
  metadata: Record<string, string>;
  sections: Section[];
};
