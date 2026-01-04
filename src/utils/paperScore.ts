import type { Document } from "../models/DocumentSchema";
import { calculateDocumentStats } from "./documentStats";

export type PaperScore = {
  score: number;
  letter: string;
  summary: string;
  strengths: string[];
  improvements: string[];
  metrics: {
    words: number;
    paragraphs: number;
    sections: number;
    citations: number;
    readMinutes: number;
  };
};

const transitionTerms = [
  "however",
  "therefore",
  "moreover",
  "furthermore",
  "consequently",
  "additionally",
  "in conclusion",
  "for example",
  "in contrast",
  "as a result",
];

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function getLetterGrade(score: number) {
  if (score >= 97) return "A+";
  if (score >= 93) return "A";
  if (score >= 90) return "A-";
  if (score >= 87) return "B+";
  if (score >= 83) return "B";
  if (score >= 80) return "B-";
  if (score >= 77) return "C+";
  if (score >= 73) return "C";
  if (score >= 70) return "C-";
  if (score >= 67) return "D+";
  if (score >= 63) return "D";
  if (score >= 60) return "D-";
  return "F";
}

function countMatches(text: string, regex: RegExp) {
  return Array.from(text.matchAll(regex)).length;
}

export function scorePaper(doc: Document): PaperScore {
  const stats = calculateDocumentStats(doc, doc.format?.lineHeight ?? 1.5);
  const sections = doc.sections.length;
  const paragraphs = doc.sections.reduce(
    (sum, section) => sum + section.body.filter((p) => p.trim().length > 0).length,
    0
  );
  const combinedBody = doc.sections
    .flatMap((section) => section.body)
    .join(" ");
  const wordCount = stats.words;
  const avgParagraphWords = paragraphs > 0 ? wordCount / paragraphs : 0;
  const citationCount = countMatches(
    combinedBody,
    /\(([^)]*\d{4}[^)]*)\)|\[\d+\]|et al\./gi
  );
  const transitionCount = transitionTerms.reduce(
    (total, term) => total + countMatches(combinedBody.toLowerCase(), new RegExp(term, "g")),
    0
  );
  const titleWords = doc.title.trim().split(/\s+/).filter(Boolean).length;
  const metadataCount = Object.values(doc.metadata ?? {}).filter(Boolean).length;
  const hasConclusion = doc.sections.some((section) =>
    /conclusion/i.test(section.title)
  );
  const hasIntroduction = doc.sections.some((section) =>
    /introduction/i.test(section.title)
  );
  const hasReferences = doc.sections.some((section) =>
    /references|bibliography|works cited/i.test(section.title)
  );
  const leadParagraphs = doc.sections.flatMap((section) => section.body).slice(0, 2);
  const hasThesis =
    leadParagraphs.join(" ").match(/thesis|argue|claim|this paper/i) !== null;

  let score = 55;

  if (titleWords >= 4 && titleWords <= 14) {
    score += 6;
  } else if (titleWords >= 2) {
    score += 3;
  }

  if (doc.subtitle) {
    score += 3;
  }

  if (sections >= 5) {
    score += 10;
  } else if (sections >= 3) {
    score += 7;
  } else if (sections >= 2) {
    score += 4;
  }

  if (hasIntroduction) score += 3;
  if (hasConclusion) score += 3;
  if (hasThesis) score += 4;

  if (wordCount >= 1500) {
    score += 14;
  } else if (wordCount >= 1200) {
    score += 12;
  } else if (wordCount >= 800) {
    score += 10;
  } else if (wordCount >= 500) {
    score += 6;
  } else if (wordCount >= 300) {
    score += 4;
  }

  if (paragraphs >= 10) {
    score += 8;
  } else if (paragraphs >= 6) {
    score += 5;
  } else if (paragraphs >= 3) {
    score += 3;
  }

  if (avgParagraphWords >= 60 && avgParagraphWords <= 160) {
    score += 6;
  } else if (avgParagraphWords >= 40 && avgParagraphWords <= 220) {
    score += 4;
  } else if (avgParagraphWords > 0) {
    score += 2;
  }

  if (citationCount >= 6) {
    score += 10;
  } else if (citationCount >= 3) {
    score += 7;
  } else if (citationCount >= 1) {
    score += 4;
  }

  if (hasReferences) {
    score += 4;
  }

  if (transitionCount >= 4) {
    score += 4;
  } else if (transitionCount >= 2) {
    score += 2;
  }

  if (metadataCount >= 3) {
    score += 4;
  } else if (metadataCount >= 1) {
    score += 2;
  }

  score = clamp(Math.round(score), 40, 100);
  const letter = getLetterGrade(score);

  const strengths: string[] = [];
  const improvements: string[] = [];

  if (sections >= 3) strengths.push("Clear section structure and hierarchy.");
  if (hasThesis) strengths.push("Thesis or claim is stated early.");
  if (wordCount >= 800) strengths.push("Solid depth and development of ideas.");
  if (citationCount >= 2) strengths.push("Evidence is anchored with citations.");
  if (transitionCount >= 2) strengths.push("Smooth logical transitions between points.");
  if (hasConclusion) strengths.push("Conclusion provides closure and synthesis.");

  if (wordCount < 500) {
    improvements.push("Expand the argument to reach 800–1200 words.");
  }
  if (sections < 3) {
    improvements.push("Add sections to improve organization and flow.");
  }
  if (!hasIntroduction) {
    improvements.push("Include an explicit introduction section.");
  }
  if (!hasConclusion) {
    improvements.push("Add a conclusion that restates the thesis and key findings.");
  }
  if (!hasThesis) {
    improvements.push("State a clear thesis or research claim early.");
  }
  if (citationCount < 2) {
    improvements.push("Add at least 2–3 scholarly citations for credibility.");
  }
  if (!hasReferences) {
    improvements.push("Add a References/Bibliography section.");
  }
  if (avgParagraphWords > 220 || avgParagraphWords < 40) {
    improvements.push("Balance paragraph length (aim for 60–160 words each).");
  }

  if (strengths.length === 0) {
    strengths.push("The foundation is clear; build with structure and evidence.");
  }
  if (improvements.length === 0) {
    improvements.push("Polish wording and tighten transitions for an A+ finish.");
  }

  const summary = `Professor’s verdict: ${letter} (${score}/100).`;

  return {
    score,
    letter,
    summary,
    strengths,
    improvements,
    metrics: {
      words: wordCount,
      paragraphs,
      sections,
      citations: citationCount,
      readMinutes: stats.readMinutes,
    },
  };
}
