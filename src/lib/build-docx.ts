import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
} from "docx";
import type { ExtractionResult } from "./extract.functions";

const SECTIONS: Array<{ key: keyof ExtractionResult; heading: string }> = [
  {
    key: "people",
    heading:
      "NAMES of PEOPLE & PEOPLES (include any pseudonyms, affiliation, title, profession or distinguishing aspect eg: astronomer, ufo witness, (King, Pope, Prince, Sir, St., Dr., Prof., Duke of., etc).",
  },
  {
    key: "topics",
    heading:
      "TOPICS themselves (+ any other significant or related indexable subject (word or phrase) mentioned on this page. Very important: INTERNAL 'see' REFERALS and lists (eg: \"fox fights eagle, see FT139p43\") can also be placed here.",
  },
  {
    key: "science",
    heading:
      "SCIENTIFIC, Medical & Technical Terms from all sciences & disciplines (inc. Illnesses, Elements, Stars, Plants, Processes, materials etc). Include the scientific names of plants or animals here (not pet names).",
  },
  { key: "filmsTV", heading: "FILMS & TV – Title and DATE only needed." },
  { key: "letters", heading: "LETTERS – Title and letter-writer only needed." },
  {
    key: "fictional",
    heading:
      "NAMES of Legendary and Fictional Characters & Names (inc. names of Monsters, Deities, Spirits, and Entities),",
  },
  {
    key: "organisations",
    heading:
      "NAMES of Organisations (inc. Professions, Religions, Societies, Institutions, Companies & Ships)",
  },
  {
    key: "places",
    heading:
      "PLACES – TOWN, COUNTY and COUNTRY – or significant geographical feature (lake, forest, mountain etc).",
  },
];

const SEPARATOR = "============================================================";

export async function buildDocxBlob(
  result: ExtractionResult,
  pageLabel: string,
): Promise<Blob> {
  const children: Paragraph[] = [];

  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      heading: HeadingLevel.HEADING_1,
      children: [new TextRun({ text: `KEYWORD CATEGORIES — ${pageLabel}`, bold: true })],
    }),
  );

  for (const section of SECTIONS) {
    children.push(
      new Paragraph({ children: [new TextRun(SEPARATOR)] }),
      new Paragraph({
        spacing: { before: 120, after: 120 },
        children: [new TextRun({ text: section.heading, bold: true })],
      }),
    );

    const items = result[section.key];
    if (items.length === 0) {
      children.push(new Paragraph({ children: [new TextRun("")] }));
    } else {
      for (const item of items) {
        children.push(
          new Paragraph({
            bullet: { level: 0 },
            children: [new TextRun(item)],
          }),
        );
      }
    }
  }

  const doc = new Document({
    styles: {
      default: { document: { run: { font: "Arial", size: 22 } } },
    },
    sections: [
      {
        properties: {
          page: {
            size: { width: 12240, height: 15840 },
            margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
          },
        },
        children,
      },
    ],
  });

  const buffer = await Packer.toBlob(doc);
  return buffer;
}
