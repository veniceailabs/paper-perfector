import type { Document } from "../models/DocumentSchema";
import Divider from "./Divider";
import MetaBlock from "./MetaBlock";
import Section from "./Section";

export function DocumentRenderer({ doc }: { doc: Document }) {
  return (
    <article className="paper-canvas">
      <header>
        <h1>{doc.title}</h1>
        {doc.subtitle ? <h2>{doc.subtitle}</h2> : null}
        <Divider />
        <MetaBlock data={doc.metadata} />
      </header>

      {doc.sections.map((section) => (
        <Section key={section.id} {...section} />
      ))}
    </article>
  );
}
