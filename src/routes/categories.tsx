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
          "The ten Fortean Times indexing categories, with the rules and worked examples used to sort every keyword.",
      },
      { property: "og:title", content: "Keyword Categories — FT Indexing Assistant" },
      {
        property: "og:description",
        content:
          "Reference guide to the ten FT keyword categories, their rules and examples.",
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
      "Surname first, comma, forenames, then title, profession or distinguishing detail in brackets. Keep surname prefixes (de, von, van de) with the surname. Include pseudonyms, affiliations, FT relationships, and peoples or nationalities.",
    examples: [
      "Keel, John A. (fortean author)",
      "von Däniken, Erich (ancient astronaut theorist)",
      "Smith, Jenny (FT correspondent)",
      "Yanomami (people)",
    ],
  },
  {
    label: "2. Topics & Case Names",
    rule:
      "Any subject discussed on the page, plus case names, customs, festivals and weather (including extremes and superlatives). All internal \"see\" referrals belong here.",
    examples: [
      "crop circles",
      "Enfield poltergeist case",
      "Up Helly Aa (festival)",
      "hottest June on record",
      "fox fights eagle, see FT139p43",
    ],
  },
  {
    label: "3. Physical, Psychological or Mystical Phenomena",
    rule:
      "Phenomena in a religious or folkloric context: apparitions, poltergeists, healing, levitation, visions, trance and possession, OOBEs and NDEs, luminous phenomena, feats of endurance, biological oddities and similar.",
    examples: [
      "apparitions",
      "sleep paralysis (hag-ridden)",
      "stigmata",
      "spontaneous human combustion",
      "near-death experience",
    ],
  },
  {
    label: "4. Organisations",
    rule:
      "Professions, appointments and specialities; religions, cults and movements; belief systems such as shamanism; societies, institutions and companies; ship names.",
    examples: [
      "Society for Psychical Research",
      "Roman Catholic Church",
      "NASA",
      "shamanism",
      "SS Waratah (ship)",
    ],
  },
  {
    label: "5. Scientific, Medical & Technical Terms",
    rule:
      "Disciplines, elements, stars, plants, processes, materials and forces; syndromes, illnesses, symptoms and treatments; scientific names of plants and animals (not pet names); brand names; animal and insect behaviour.",
    examples: [
      "archaeoastronomy",
      "Capgras syndrome",
      "Panthera pardus",
      "magnetite",
      "Geiger counter",
    ],
  },
  {
    label: "6. Legendary & Fictional Names",
    rule:
      "Legends and folklore; characters from fiction, film and books; monsters and unidentified creatures; deities, spirits and entities; colloquial names for any of these.",
    examples: [
      "Mothman",
      "Loch Ness monster (Nessie)",
      "Baba Yaga",
      "Cthulhu",
      "Green Man",
    ],
  },
  {
    label: "7. Films & TV",
    rule: "Title with the release or broadcast date only.",
    examples: ["The Exorcist (1973)", "Quatermass and the Pit (1967)"],
  },
  {
    label: "8. Letters & It Happened To Me",
    rule:
      "Reader submissions, corrections, refutations and unusual experiences. Letters and IHTM: title and writer only. Simulacra: title and sender only — usually image related, so remember the asterisk.",
    examples: [
      "Phantom hitchhiker — Alan Murdie",
      "Face in the tree stump — Sue Rowe*",
    ],
  },
  {
    label: "9. Places",
    rule:
      "Town, county and country where given (no street addresses), plus significant geographical features such as lakes, forests, mountains and rivers. Compound forms are fine.",
    examples: [
      "Halle, East Germany",
      "Lyme Regis, Dorset",
      "Loch Ness, Scotland",
      "Mount Shasta, California",
    ],
  },
  {
    label: "10. Behaviour",
    rule:
      "Reactive verbs, nouns and adjectives; acts of aggression recorded in both directions; manipulation by authorities; conflicts; fads and manias; sleep and dream phenomena; conspiracies, delusions, panics, pranks; collectors.",
    examples: [
      "fear, frightened",
      "attack on: postman",
      "attack by: dog",
      "manipulation by: government",
      "tulip mania",
      "conspiracy theories",
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
            categories. Items that have an associated image (photo,
            illustration, simulacrum) take an asterisk <span className="font-mono">*</span> at
            the end of the entry.
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
