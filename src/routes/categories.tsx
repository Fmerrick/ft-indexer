import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { Card } from "@/components/ui/card";

export const Route = createFileRoute("/categories")({
  head: () => ({
    meta: [
      { title: "Keyword Categories — FT Indexing Assistant" },
      {
        name: "description",
        content:
          "The ten Fortean Times indexing categories (v.30c), with the rules and worked examples used to sort every keyword.",
      },
      { property: "og:title", content: "Keyword Categories — FT Indexing Assistant" },
      {
        property: "og:description",
        content:
          "Reference guide to the ten FT keyword categories (v.30c), their rules and examples.",
      },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CategoriesPage,
});

const CATEGORY_GUIDE: Array<{
  label: string;
  rule: string;
  examples: string[];
}> = [
  {
    label: "1. Names of People & Peoples",
    rule:
      "Surname first, comma, forenames, then any pseudonym, affiliation, title, profession or distinguishing aspect in brackets (astronomer, ufo witness, editor, King, Pope, Sir, St., Dr., Prof. — with subject and/or institution, Duchess of). Use St. for Saint. Keep surname prefixes (de, von, van de) with the surname. Add 'FT correspondent' or 'FT contributor' where indicated. If only a surname with no qualification, use 'Mr' or 'Mrs' as appropriate — omit if uncertain. For Peoples include Nation/Tribe/Origin.",
    examples: [
      "Keel, John A. (fortean author)",
      "von Däniken, Erich (ancient astronaut theorist)",
      "Smith, Jenny (FT correspondent)",
      "Bloggs, Mr Joe",
      "Navajo (people)",
      "Ainu (people)",
    ],
  },
  {
    label: "2. Topics + Casenames",
    rule:
      "A general category for observations, reports or discussions of any indexable object, subject, word or phrase mentioned on the page. Includes casenames; strange phenomena generally (ufology, earth mysteries, lost lands, coincidences & synchronicity, luck, falls of frogs/fish/stones, strange forces, time travel & time slips, weather anomalies, aerial booms & hums); unusual consciousness experiences (entity encounters, night paralysis, savants, altered states incl. entheogens, OOBEs & NDEs, sleep & dream phenomena, trance & hypnosis); cultural/sociological/psychological (witches, shamans, gurus, rituals & festivals, mind control & conspiracies, crime & punishment, cults); spiritual/mystical/folkloric (stigmata, levitation, miracles, ghosts & hauntings incl. poltergeists, omens & portents, spontaneous images in nature); psychology & parapsychology (telepathy, remote viewing, clairvoyance, psychokinesis, multiple personality, mass hysteria, prediction & prophecy, feats & austerities); human & animal behaviour (swarms & migration, attacks on & attacks by, animal intelligence, outsiders & imposters); cryptozoology & cryptobotany; out-of-place creatures & objects; exploration & new lands; reactive behaviour words (frighten, frightening, frightened); lists by title or subject; and the unclassified remainder. Very important: all internal \"see\" referrals go here.",
    examples: [
      "crop circles",
      "Bermuda Triangle (casename)",
      "Skinwalker Ranch",
      "Satanic Panic",
      "time slips",
      "coincidences & synchronicity",
      "frightened, frightening",
      "fox fights eagle, see FT139p43",
    ],
  },
  {
    label: "3. Names of Organisations and Vessels",
    rule:
      "Professions and professional organisations; religions & sects; societies & institutions; philosophical, political or religious movements; companies & brand names; named vessels, spacecraft and submersibles (manned or unmanned).",
    examples: [
      "Society for Psychical Research",
      "Roman Catholic Church",
      "NASA",
      "Mary Celeste, The (vessel)",
      "Voyager II (spacecraft)",
    ],
  },
  {
    label: "4. Scientific, Medical & Technical",
    rule:
      "Terms from and references to any science, academic discipline or speciality (philosophical & theoretical sciences, empirical sciences, history & anthropology, astronomy & cosmology, medicine & biology, archaeology & palaeontology). Include common and scientific names of organisms, plants or animals — omit pet names. Include illnesses, elements, stars & planets, processes, materials, equipment, classifications.",
    examples: [
      "archaeoastronomy",
      "Capgras syndrome",
      "Panthera pardus",
      "magnetite",
      "Geiger counter",
      "Betelgeuse (star)",
    ],
  },
  {
    label: "5. Names (Legendary and Fictional)",
    rule:
      "From mythology, fiction, folklore, legend, fantasy, any religion and modern popular culture. Names of gods, deities, spirits and non-human entities; colloquial, regional, ethnic or tribal names for monsters.",
    examples: [
      "Mothman",
      "Loch Ness monster (Nessie)",
      "Baba Yaga",
      "Cthulhu",
      "Green Man",
    ],
  },
  {
    label: "6. Places",
    rule:
      "Town, county/state/province (as appropriate) and country only — no street addresses. Significant geographical features (lake, forest, mountain, river). Fixed, named locations such as racetracks and airports.",
    examples: [
      "Halle, East Germany",
      "Lyme Regis, Dorset",
      "Loch Ness, Scotland",
      "Mount Shasta, California",
      "Brooklands Racetrack, Surrey",
      "Chicago-O'Hare Airport, Illinois",
    ],
  },
  {
    label: "7. Dates",
    rule:
      "Year, month, day (when given); durations or extensions; periods and eras.",
    examples: [
      "6 June 1978",
      "from 6 June 1978 to 12 January 1979",
      "the 1800s",
      "the Tudor Period",
      "New Kingdom Egypt",
      "Meiji Era",
    ],
  },
  {
    label: "8. Films & TV (Short Item)",
    rule: "Title and date only needed.",
    examples: ["The Exorcist (1973)", "Quatermass and the Pit (1967)"],
  },
  {
    label: "9. Letters & It Happened To Me (Short Item)",
    rule:
      "Title and correspondent name only. Contents will be captured under the other categories as appropriate.",
    examples: [
      "Phantom hitchhiker — Alan Murdie",
      "Face in the tree stump — Sue Rowe*",
    ],
  },
  {
    label: "10. Reviews",
    rule: "Title and author of the reviewed item.",
    examples: [
      "The Mothman Prophecies — John A. Keel",
      "The Day After Roswell — Philip J. Corso",
    ],
  },
];

function CategoriesPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="mx-auto max-w-4xl px-6 py-8">
          <Link
            to="/"
            className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" /> Back to the indexer
          </Link>
          <h1 className="text-3xl font-semibold tracking-tight">
            Keyword Categories
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Every indexable term on a page is sorted into one of these ten
            categories. Not all headings will appear on the same page — but
            combinations of them will. Items that have an associated image
            (photo, illustration, simulacrum) take an asterisk{" "}
            <span className="font-mono">*</span> at the end of the entry.
          </p>
          <p className="mt-3 text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">Version:</span> v.30c
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-8 space-y-4">
        {CATEGORY_GUIDE.map((cat) => (
          <Card key={cat.label} className="p-5">
            <h2 className="text-base font-semibold">{cat.label}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{cat.rule}</p>
            <div className="mt-3">
              <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Examples
              </div>
              <ul className="mt-1.5 space-y-1">
                {cat.examples.map((ex) => (
                  <li key={ex} className="font-mono text-xs text-foreground/90">
                    {ex}
                  </li>
                ))}
              </ul>
            </div>
          </Card>
        ))}
      </main>
    </div>
  );
}
