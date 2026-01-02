import type { Document } from "../models/DocumentSchema";

export type TemplateType = "blank" | "apa" | "mla" | "chicago";

const today = new Date().toISOString().split("T")[0];

export const templates: Record<TemplateType, Document> = {
  blank: {
    title: "Untitled Document",
    subtitle: "A new paper",
    metadata: {
      author: "Your Name",
      date: today,
      version: "1.0.0",
      classification: "Draft",
    },
    sections: [
      {
        id: "introduction",
        level: 1,
        title: "Introduction",
        body: [
          "Start writing your paper here. Replace this text with your own content.",
          "You can add multiple paragraphs, and they will be formatted automatically.",
        ],
        monoBlocks: [],
      },
      {
        id: "main-content",
        level: 2,
        title: "Main Content",
        body: [
          "Add your main content here. You can create sections and subsections using different heading levels.",
          "Each section can contain multiple paragraphs and code examples.",
        ],
        monoBlocks: [],
      },
      {
        id: "conclusion",
        level: 2,
        title: "Conclusion",
        body: [
          "Wrap up your paper with a conclusion section.",
          "Don't forget to export to PDF when you're done!",
        ],
        monoBlocks: [],
      },
    ],
  },

  apa: {
    title: "Research Paper Title Goes Here",
    subtitle: "Subtitle (if applicable)",
    metadata: {
      author: "Your Name",
      date: today,
      version: "1.0.0",
      classification: "APA Format (7th Edition)",
      institution: "Your Institution",
      course: "Course Number and Title",
      professor: "Professor Name",
    },
    sections: [
      {
        id: "abstract",
        level: 1,
        title: "Abstract",
        body: [
          "Provide a brief summary of your research (150-250 words). Include the purpose, methods, results, and conclusions of your study.",
        ],
        monoBlocks: [],
      },
      {
        id: "introduction",
        level: 1,
        title: "Introduction",
        body: [
          "Begin with an engaging introduction that establishes the context and significance of your research.",
          "Clearly state your research question or thesis.",
        ],
        monoBlocks: [],
      },
      {
        id: "literature-review",
        level: 1,
        title: "Literature Review",
        body: [
          "Discuss relevant scholarly sources and research that relates to your topic.",
          "Synthesize the literature to show how your work fits into the broader academic conversation.",
        ],
        monoBlocks: [],
      },
      {
        id: "methodology",
        level: 1,
        title: "Methodology",
        body: [
          "Describe your research methods in detail so that others could replicate your study.",
          "Explain your research design, participants, and procedures.",
        ],
        monoBlocks: [],
      },
      {
        id: "results",
        level: 1,
        title: "Results",
        body: [
          "Present your findings clearly and objectively.",
          "Use tables, figures, or other visual aids as appropriate.",
        ],
        monoBlocks: [],
      },
      {
        id: "discussion",
        level: 1,
        title: "Discussion",
        body: [
          "Interpret your findings and discuss their implications.",
          "Address limitations and suggest directions for future research.",
        ],
        monoBlocks: [],
      },
      {
        id: "references",
        level: 1,
        title: "References",
        body: [
          "List all sources cited in your paper in APA format (alphabetical, hanging indent).",
        ],
        monoBlocks: [],
      },
    ],
  },

  mla: {
    title: "Essay Title in Title Case Goes Here",
    subtitle: undefined,
    metadata: {
      author: "Your Name",
      date: today,
      version: "1.0.0",
      classification: "MLA Format (9th Edition)",
      institution: "Your School",
      course: "Course Number",
      professor: "Professor Name",
    },
    sections: [
      {
        id: "opening",
        level: 1,
        title: "Opening Paragraph",
        body: [
          "Begin with an engaging hook that captures your reader's attention.",
          "Introduce your topic and provide necessary context.",
          "End with a clear thesis statement that presents your argument.",
        ],
        monoBlocks: [],
      },
      {
        id: "body-1",
        level: 1,
        title: "Body Paragraph 1",
        body: [
          "Start with a clear topic sentence that supports your thesis.",
          "Provide evidence from reliable sources.",
          "Explain how the evidence supports your point.",
          "Connect back to your thesis.",
        ],
        monoBlocks: [],
      },
      {
        id: "body-2",
        level: 1,
        title: "Body Paragraph 2",
        body: [
          "Present your second main point with supporting evidence.",
          "Analyze the significance of this evidence.",
          "Show how it contributes to your overall argument.",
        ],
        monoBlocks: [],
      },
      {
        id: "body-3",
        level: 1,
        title: "Body Paragraph 3",
        body: [
          "Develop your third main point with appropriate evidence.",
          "Discuss counterarguments if relevant.",
          "Strengthen your position with analysis.",
        ],
        monoBlocks: [],
      },
      {
        id: "conclusion",
        level: 1,
        title: "Conclusion",
        body: [
          "Restate your thesis in a new way.",
          "Summarize your main points briefly.",
          "Provide a final thought or call to action.",
        ],
        monoBlocks: [],
      },
      {
        id: "works-cited",
        level: 1,
        title: "Works Cited",
        body: [
          "List all sources in alphabetical order.",
          "Use hanging indentation for each entry.",
          "Follow MLA format exactly for citations.",
        ],
        monoBlocks: [],
      },
    ],
  },

  chicago: {
    title: "Your Paper Title Here",
    subtitle: "Subtitle if applicable",
    metadata: {
      author: "Your Name",
      date: today,
      version: "1.0.0",
      classification: "Chicago Manual of Style (17th Edition)",
      institution: "Your Institution",
      course: "Course Title",
    },
    sections: [
      {
        id: "introduction",
        level: 1,
        title: "Introduction",
        body: [
          "Open with an engaging discussion of your topic.",
          "Establish the significance and context of your research.",
          "Present your thesis statement clearly.",
        ],
        monoBlocks: [],
      },
      {
        id: "chapter-1",
        level: 1,
        title: "Chapter One: [Topic]",
        body: [
          "Develop your first major argument or section.",
          "Provide detailed analysis and evidence.",
          "Use subheadings to organize complex material.",
        ],
        monoBlocks: [],
      },
      {
        id: "chapter-2",
        level: 1,
        title: "Chapter Two: [Topic]",
        body: [
          "Continue your analysis with the second major point.",
          "Build on previous arguments.",
          "Support claims with scholarly evidence.",
        ],
        monoBlocks: [],
      },
      {
        id: "chapter-3",
        level: 1,
        title: "Chapter Three: [Topic]",
        body: [
          "Present your final major argument or analysis.",
          "Synthesize ideas developed in previous sections.",
          "Strengthen your overall thesis.",
        ],
        monoBlocks: [],
      },
      {
        id: "conclusion",
        level: 1,
        title: "Conclusion",
        body: [
          "Summarize your main arguments.",
          "Discuss the broader implications of your research.",
          "Suggest areas for future investigation.",
        ],
        monoBlocks: [],
      },
      {
        id: "bibliography",
        level: 1,
        title: "Bibliography",
        body: [
          "List all sources consulted, in alphabetical order.",
          "Follow Chicago style format for all entries.",
          "Include full publication information.",
        ],
        monoBlocks: [],
      },
    ],
  },
};
