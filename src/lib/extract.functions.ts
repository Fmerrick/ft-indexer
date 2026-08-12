import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const InputSchema = z.object({
  filename: z.string(),
  dataBase64: z.string().min(10),
});

export type Confidence = "high" | "medium" | "low";
export type IndexItem = {
  text: string;
  confidence: Confidence;
  context: string;
  reason: string;
};

export type ExtractionResult = {
  people: IndexItem[];
  topics: IndexItem[];
  phenomena: IndexItem[];
  organisations: IndexItem[];
  science: IndexItem[];
  fictional: IndexItem[];
  filmsTV: IndexItem[];
  letters: IndexItem[];
  places: IndexItem[];
  behaviour: IndexItem[];
};



const SYSTEM_PROMPT = `You are an indexing assistant for Fortean Times magazine.
The user will send you one page (a PDF). Read the ENTIRE page including all articles, headlines, captions, "Extra! Extra!" newspaper headline lists, and picture captions.

GLOBAL RULES:
- Index any significant, related, indexable subject (word or phrase) mentioned on the page.
- If an item on this page has an associated image (photo, illustration, simulacrum), append an asterisk "*" to the end of that item's text.

Extract every indexable term into these 10 categories. Follow these rules strictly:

1) people — Names of People & Peoples. Surname first, comma, forenames, then (title/profession/distinguishing info in brackets). Include titles (King, Pope, Sir, St., Dr., Prof., Duke of), profession or speciality (astronomer, ufo witness, publisher), surname prefixes (de, da, de la, el, le, la, von, van de — treat as part of the main surname), pseudonyms, affiliations and associations, and FT relationships (correspondent, contributor). Include peoples/nationalities.
2) topics — Topics & Casenames. Any topic subject to discussion or discourse on the page; case names; customs; festivals; weather (including unexpected or extreme conditions and weather superlatives such as hottest, longest, worst). Include ALL "see" referrals in the form: "fox fights eagle, see FT139p43".
3) phenomena — Physical, Psychological or Mystical Phenomena (religious or folkloric context): apparitions, bedroom invaders, bilocation, prodigious fasting, ghosts and mysterious presences, hag-ridden/sleep paralysis, healing, levitation, miracles, precognition & prophecy, poltergeists, psychokinesis/telekinesis, religious imagery & iconography, remote viewing/travelling clairvoyance, stigmata, telepathy, teleportation, visions & hallucinations, bodily control, OOBEs & NDEs, light & luminous phenomena (aura, halo), panic, social or religious drug-related experiences (entheogens: LSD, DMT, bwiti), trance/ecstasy/glossolalia, mediumship and possession, feats of endurance or strength, apparent control of elements (e.g. fire-walking), sacrifice, biological oddities (extra digits, tallest, shortest, teratology), and other unclassified phenomena.
4) organisations — Organisations: professions, appointments, specialities; religions, cults, movements; social belief systems (especially shamanism); societies, institutions, companies; ship names.
5) science — Scientific, Medical & Technical terms: disciplines (physics, biology, archaeology, maths theories, sociology); elements, stars, plants, processes, materials, forces; syndromes, illnesses, symptoms, treatments, procedures; scientific names of plants and animals (exclude pet names); brand names; animal & insect behaviour.
6) fictional — Legendary and Fictional names: legends & folklore; characters from fiction, films, books; monsters and unidentified creatures; deities, spirits and entities from religions; related words from folklore, legends and belief systems; colloquial names for the above.
7) filmsTV — Films & TV: title and publication/release date only.
8) letters — Letters & "It Happened To Me" (reader submissions, corrections, refutations, unusual experiences). Letters: title and letter-writer only. IHTM: title and writer only. Simulacra: title and sender only (usually image related — remember the asterisk).
9) places — Town, county and country where given (no street addresses); significant geographical features (lake, forest, mountain, river etc). Include compound forms like "Halle, East Germany".
10) behaviour — Reactive words (verbs, nouns & adjectives; e.g. fear, frighten, frightening, frightened, afraid). Acts of aggression have two directions: record both "attack on: (person/animal/object)" and "attack by: (person/animal/object)". Also: manipulation by (government, institutions, authorities); large-scale conflicts; fads, manias, obsessions, compulsions; sleep & dream phenomena; theorising — conspiracies, delusions, panics, pranks; collectors.

For EVERY item, also return:
- confidence: "high" | "medium" | "low"
  - "high" — clearly stated on the page, unambiguous, clearly belongs in this category.
  - "medium" — present but wording/spelling/category placement is uncertain.
  - "low" — inferred or possibly an OCR guess.
- context: the exact sentence or short paragraph from the page where the term appears (verbatim quote, 1–3 sentences). If the term is only in a caption/headline list, quote that caption or headline. Keep under 400 characters.
- reason: a brief (1–2 sentence) explanation of why you placed this term in this specific category, so a human editor can quickly judge inclusion.

Return ONLY JSON matching the schema. Each array contains objects of the form { "text": string, "confidence": "high" | "medium" | "low", "context": string, "reason": string }. Do not add commentary. If a category has no items, return an empty array.`;


export const extractKeywords = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => InputSchema.parse(input))
  .handler(async ({ data }): Promise<ExtractionResult> => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("Missing LOVABLE_API_KEY");

    const dataUrl = `data:application/pdf;base64,${data.dataBase64}`;

    const body = {
      model: "google/gemini-3.6-flash",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Extract all indexable keywords from this Fortean Times page into the 8 categories.",
            },
            {
              type: "file",
              file: { filename: data.filename, file_data: dataUrl },
            },
          ],
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "ft_index",
          strict: true,
          schema: (() => {
            const itemSchema = {
              type: "array",
              items: {
                type: "object",
                additionalProperties: false,
                properties: {
                  text: { type: "string" },
                  confidence: { type: "string", enum: ["high", "medium", "low"] },
                  context: { type: "string" },
                  reason: { type: "string" },
                },
                required: ["text", "confidence", "context", "reason"],

              },
            };
            return {
              type: "object",
              additionalProperties: false,
              properties: {
                people: itemSchema,
                topics: itemSchema,
                science: itemSchema,
                filmsTV: itemSchema,
                letters: itemSchema,
                fictional: itemSchema,
                organisations: itemSchema,
                places: itemSchema,
              },
              required: [
                "people",
                "topics",
                "science",
                "filmsTV",
                "letters",
                "fictional",
                "organisations",
                "places",
              ],
            };
          })(),
        },
      },
    };

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Lovable-API-Key": apiKey,
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const text = await res.text();
      if (res.status === 429)
        throw new Error("Rate limit reached — please try again in a moment.");
      if (res.status === 402)
        throw new Error("AI credits exhausted. Add credits in Settings → Plans & credits.");
      throw new Error(`AI gateway error ${res.status}: ${text.slice(0, 400)}`);
    }

    const json = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = json.choices?.[0]?.message?.content ?? "{}";
    const parsed = JSON.parse(content) as ExtractionResult;

    // Ensure all keys exist
    const empty: ExtractionResult = {
      people: [],
      topics: [],
      science: [],
      filmsTV: [],
      letters: [],
      fictional: [],
      organisations: [],
      places: [],
    };
    return { ...empty, ...parsed };
  });
