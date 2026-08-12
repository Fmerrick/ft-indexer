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
      "NAMES of PEOPLE & PEOPLES (include titles (King, Pope, Sir, St., Dr., Prof., Duke of), profession or speciality, surname prefixes (de, da, von, van de etc), pseudonyms, affiliations, and FT relationship (correspondent, contributor)).",
  },
  {
    key: "topics",
    heading:
      "TOPICS + CASE NAMES (any topic discussed on this page, case names, customs, festivals, weather including extremes and superlatives. Very important: all \"see\" referrals (eg: \"fox fights eagle, see FT139p43\")).",
  },
  {
    key: "phenomena",
    heading:
      "PHYSICAL, PSYCHOLOGICAL or MYSTICAL PHENOMENA (religious or folkloric context: apparitions, bilocation, ghosts, healing, levitation, miracles, poltergeists, precognition, stigmata, telepathy, teleportation, visions, OOBEs & NDEs, trance & possession, feats of endurance, biological oddities etc).",
  },
  {
    key: "organisations",
    heading:
      "NAMES of ORGANISATIONS (inc. professions, appointments, specialities, religions, cults, movements, belief systems, societies, institutions, companies & ships)",
  },
  {
    key: "science",
    heading:
      "SCIENTIFIC, Medical & Technical Terms from all disciplines (inc. illnesses, symptoms, treatments, elements, stars, plants, processes, materials, forces, brand names, animal & insect behaviour). Include the scientific names of plants or animals here (not pet names).",
  },
  {
    key: "fictional",
    heading:
      "NAMES of Legendary and Fictional Characters & Names (inc. legends & folklore, characters from fiction, monsters and unidentified creatures, deities, spirits and entities, and colloquial names for the above),",
  },
  { key: "filmsTV", heading: "FILMS & TV – Title and DATE only needed." },
  {
    key: "letters",
    heading:
      "LETTERS & IT HAPPENED TO ME – Title and letter-writer only needed (Simulacra: title and sender).",
  },
  {
    key: "places",
    heading:
      "PLACES – TOWN, COUNTY and COUNTRY – or significant geographical feature (lake, forest, mountain, river etc).",
  },
  {
    key: "behaviour",
    heading:
      "BEHAVIOUR – reactive words (verbs, nouns & adjectives, eg. fear, frighten, frightened). Attacks on / attacks by; manipulation by authorities; large-scale conflicts; fads, manias, obsessions; sleep & dream phenomena; conspiracies, delusions, panics, pranks; collectors.",
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
            children: [new TextRun(item.text)],
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
