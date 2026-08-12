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

Extract every indexable term into these 8 categories. Follow these rules strictly:

1) people — Names of People & Peoples. Surname first, comma, forenames, then (title/profession/distinguishing info in brackets). Include witnesses, victims, contributors, officials, pseudonyms, and nationalities/peoples (e.g. "British").
2) topics — The topics of the page + any other significant/indexable subject (word or phrase). Include specific attack constructions like "attack by: skinheads", "attack on: schoolgirl", "attack with; razors". Include INTERNAL "see" REFERRALS in the form: "self-victimisers and hoaxers: see FT71:xx".
3) science — Scientific, medical & technical terms (illnesses, elements, stars, plants, animals by scientific/common name — NOT pet names, processes, materials, technology). Include physical objects central to the story (e.g. wheelchair, aircraft).
4) filmsTV — Films & TV titles with date, if any.
5) letters — Reader letters: title and letter-writer, if any.
6) fictional — Legendary & fictional characters, monsters, deities, spirits, entities (e.g. Satan).
7) organisations — Organisations, professions, religions, societies, institutions, companies, ships. Include role/profession nouns (e.g. skinhead, prosecutor, jogger, pilot, victim).
8) places — Town, county, country, or significant geographical feature. Include compound forms like "Halle, East Germany".

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
