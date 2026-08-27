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
      "NAMES of PEOPLE & PEOPLES — include any pseudonym, affiliation, title, profession or distinguishing aspect (astronomer, ufo witness, editor, King, Pope, Sir, St., Dr., Prof. — with subject/institution, Duchess of). Use St. for Saint. Add 'FT correspondent' or 'FT contributor' where indicated. For Peoples: Nation/Tribe/Origin.",
  },
  {
    key: "topics",
    heading:
      "TOPICS + CASENAMES — any indexable object, subject, word or phrase mentioned on the page: casenames, strange phenomena, ufology, earth mysteries, coincidences, falls, time slips, weather anomalies, consciousness experiences, entity encounters, OOBEs & NDEs, rituals, conspiracies, ghosts & hauntings, stigmata, omens, psychical phenomena, feats, human & animal behaviour, attacks on/by, cryptozoology, out-of-place creatures & objects, reactive behaviour words, lists. Very important: all \"see\" referrals (eg: \"fox fights eagle, see FT139p43\").",
  },
  {
    key: "organisations",
    heading:
      "NAMES of ORGANISATIONS and VESSELS — professions & professional organisations, religions & sects, societies & institutions, movements, companies & brand names, named vessels, spacecraft & submersibles (eg. The Mary Celeste, Voyager II).",
  },
  {
    key: "science",
    heading:
      "SCIENTIFIC, Medical & Technical — terms from any science, academic discipline or speciality. Common and scientific names of organisms, plants or animals (omit pet names). Illnesses, elements, stars & planets, processes, materials, equipment, classifications.",
  },
  {
    key: "fictional",
    heading:
      "NAMES (Legendary and Fictional) — from mythology, fiction, folklore, legend, fantasy, religion and modern popular culture. Gods, deities, spirits and non-human entities; colloquial, regional, ethnic or tribal names for monsters.",
  },
  {
    key: "places",
    heading:
      "PLACES — TOWN, COUNTY/STATE/PROVINCE and COUNTRY only; significant geographical features (lake, forest, mountain, river); fixed, named locations (eg. Brooklands Racetrack, Chicago-O'Hare Airport).",
  },
  {
    key: "dates",
    heading:
      "DATES — year, month, day (when given); durations (eg. from 6 June 1978 to 12 January 1979); periods and eras (eg. the 1800s, the Tudor Period, New Kingdom Egypt, Meiji Era).",
  },
  {
    key: "filmsTV",
    heading: "SHORT ITEMS: FILMS & TV — title and date only needed.",
  },
  {
    key: "letters",
    heading:
      "SHORT ITEMS: LETTERS & IT HAPPENED TO ME — title and correspondent name only.",
  },
  {
    key: "reviews",
    heading: "REVIEWS — title and author of the reviewed item.",
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
      children: [new TextRun({ text: `KEYWORD CATEGORIES, for ISSUE: ${pageLabel} — v.30c`, bold: true })],
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
            children: [
              new TextRun(item.page ? `${item.text} — p${item.page}` : item.text),
            ],
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
