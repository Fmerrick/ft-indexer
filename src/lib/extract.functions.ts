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
  page: string;
};

export type ExtractionResult = {
  people: IndexItem[];
  topics: IndexItem[];
  organisations: IndexItem[];
  science: IndexItem[];
  fictional: IndexItem[];
  places: IndexItem[];
  dates: IndexItem[];
  filmsTV: IndexItem[];
  letters: IndexItem[];
  reviews: IndexItem[];
};



const SYSTEM_PROMPT = `You are an indexing assistant for Fortean Times magazine, using the FT keyword category system v.30c.
The user will send you a PDF that may contain MANY pages. Process EVERY page in the PDF, from the first to the last — do not stop after the first page. On each page read all articles, headlines, captions, "Extra! Extra!" newspaper headline lists, and picture captions.

PAGE NUMBERS:
- Look for the printed page number, usually at the bottom (sometimes the top) of each page, and use it for the "page" field of every item found on that page.
- Return it as a two-digit reference with a capital P prefix (e.g. "P08", "P12", "P03").
- If no page number is printed on that page, return the PDF sheet position as "S03" (two digits with an S prefix).


GLOBAL RULES:
- Every item must record which page it came from.
- Index any significant, related, indexable subject (word or phrase) mentioned on the page.
- If an item on this page has an associated image (photo, illustration, simulacrum), append an asterisk "*" to the end of that item's text.

OVER-INDEX, DO NOT UNDER-INDEX. A human editor will delete anything unwanted, so it is far worse to miss a term than to include a marginal one. Aim for a rich, generous index of every page. In particular, index (in addition to proper names):
- Common nouns and generic terms that carry the story: hangover, compound, robes, burqa, pharmacy, tourists, followers, police, federal agencies, school-student, community, sect, doctrine, asylum, relocation, kidnapping, beatings, isolation, enslavement, sexual abuse, anti-cult legislation.
- Reactive behaviour words — verbs, nouns and adjectives describing reactions and manner (hostile, menacing, vicious, frightened, heavy drinking) — each as its own topic entry.
- Causes and modes of events: death (by falling), death (by drowning), deaths (of mother & children).
- Processes, techniques, conditions and superlatives in the science category: plating (industrial process), radio-carbon dating, permafrost, cancer (cause of), organs (internal, damage to), pregnant, world's oldest.
- Generic collective/organisational nouns in the organisations category: rabbi, sect, community (religious), community (cultish), orthodox (ultra Jewish), followers, tourists, police (US), federal agencies (US), archæologists, prehistorians, excavators (Victorian), cavers, witches, movements such as anti-Zionism, and religion/sect adjectives (Jewish (sects), Judaist (sects)).
- EVERY occupation, trade, job or role noun mentioned anywhere on the page must be indexed under organisations, without exception — including perpetrators, victims and bystanders described by a role: murderer, burglar, sex-worker, taxi-driver, passenger, detective, prosecutor, lawyer, judge, crime scene investigator, forensic investigator, police, Queen's Council. A crime page will typically yield a dozen occupation entries.
- Split distinct aspects of one broad subject into SEPARATE topic entries rather than collapsing them: "DNA evidence (anomalies)", "DNA evidence (fallibility of)", "DNA evidence (Low Count)", "DNA profiling (forensics)", "genetic fingerprinting" are five entries, not one. Also index physical evidence items as topics: cigarette butt (as DNA evidence), bank notes (as genetic evidence), database (police, genetic), criminal trial (high profile cases).
- Nationalities and peoples in the people category: index every nation/ethnicity mentioned (e.g. Greek, Navajo, American) even when used only adjectivally.
- Physical settings, materials and landscape features: cave (entrances), cliff, gorge, limestone, escarpment, lamp (on caving hard hat), hat (hard, cavers).
- Groups of ordinary people in the people category: villagers (mediaeval), tourists, visitors.
- Periods and eras alongside exact dates: Ice Age, 41,300 years ago, prehistory, Victorian, Middle Ages, and bare months (April) when given.
- Cross-references written in full (see the SEE REFERRALS rule below).
- Occupation and role nouns belong in ORGANISATIONS, never in people: miners, farmers, apprentices, gardeners (novice), allotment holders. Only named individuals and nations/peoples/religious groups (Catholics (Irish), Protestants (English & Scottish)) go in people.
- Everyday objects, structures and materials mentioned in passing are indexable topics: bottles, tin cans (as bird scarers), cloche (glass enclosure for plants), cree (shelter for racing pigeons), bird scarers.
- Index the SAME subject from several angles as separate entries, e.g. "folklore (of allotments)" and "folklore (of gardening)"; "waxing (of Moon)" and "waning (of Moon, best time to mow lawn)".
- Attitudes, mental states and social behaviour are topics: gullibility (of novices), joke (on gardening novices), magical (thinking), rituals (of gardeners), suspicion (of new plants), survival (strategy), wisdom (in collective unconscious), hazards (of gardening).
- Quoted maxims and sayings: give the quotation in quote marks with its attribution in parentheses, e.g. "As above, so below" (philosophical maxim; attrib. Hermes Trismegistus) — and also index the person quoted (Hermes Trismegistus) under people.
- Generic non-human entities go under fictional even when unnamed: God (deity), evil spirits (generally).
- Science must include the plain everyday plant, animal, body, weather, soil and process words too, not only the Latin-name entries: pigeons, leeks, seeds (vegetable), soil (warmth of), weeds, lawn, weather (British), buttocks (bare, test of soil warmth), planting (critical timing of), auspicious (times for planting), astrology (in gardening), gravity, light (levels), water, plant tissues, unconscious (collective).
- Vague time expressions and times of day belong in dates: "olden times", "nowadays", "the old days", dawn, dusk, midnight, 3 AM, first light, nightfall.
- MULTIPLE SENSES — when one word carries more than one indexable sense, output it once for EACH sense, with a distinguishing parenthetical, including within the same category. E.g. "Victorian (era)" AND "Victorian (house style)" both under dates; "Victorian (house style)" may also appear as a topic. Do the same for any term used both as a period and as a style, both as a place and as an institution, or both literally and figuratively.
- Every entry that is not fully self-explanatory should carry a parenthetical qualifier — including places, e.g. "Boiler Road (local landmark, gardener's reference)".
A typical single magazine page of news or feature articles should yield dozens of entries across the categories, not a handful — a feature page will often yield 60–100 entries in total.

BOOK/FILM REVIEW PAGES ARE THE EXCEPTION — on a page that is a review (or a page of reviews), index concisely rather than exhaustively: the reviewer (as "FT reviewer"), the author/translator, the reviewed title with its author under reviews, the publisher under organisations, the handful of substantive subjects, named people, places, dates and scientific/material terms actually discussed. Do not manufacture generic-noun or reactive-behaviour entries for review pages.

REGULAR REVIEW COLUMNS — some regular FT columns review or survey media and mention MANY titles, often only in passing: "The Reverend's Review" (films), its earlier name "Flicks that Church Forgot" (films), "Television" (TV shows), "The Haunted Generation" (sound recordings and books), and any similar review-oriented column. For these columns, list EVERY film, TV programme, sound recording or book mentioned in the column under reviews — even titles mentioned only in passing, in a list, or as a comparison. Give each with its date or author/artist when given. Do not skip any title.

SEE REFERRALS — never output a bare reference like "see FT378:4-5". List them with the subject as the headword and the referral in parentheses, in the form: "<subject> (for more on, see FT386:20-21)" (e.g. "resurrections (for more on, see FT386:20-21)", "apotropaic marks (for more on, see FT378:4-5)"). Take the subject from the surrounding text.

HEADWORD FIRST — for every entry, lead with the single most important word (the sortable headword) and push the less important words into the parenthetical context. Examples: "bin (for clothing donations, woman trapped inside)" NOT "clothing donation bin (woman trapped inside)"; "resurrection (attempted by prayer power)" NOT "prayer power (attempts to resurrect deceased)"; "brain storage (human, by cryonics)" NOT "human brain storage (low-temperature cryonics)"; "Christianity (religious doctrine)" NOT "Christian Church (religious doctrine)"; "GoFundMe (internet crowdfunding platform)" NOT "GoFundMe (crowdfunding platform)" when more context helps. This applies across ALL categories.

NEWS SOURCE CITATIONS ARE NOT INDEXABLE — when a news item is credited to a source (e.g. "BBC News, 6 Jan 2020", "Daily Mail", "Newsweek", "Independent"), do NOT index the source organisation and do NOT index the publication date of the report. Dates labelled only as "date of news report" must be omitted entirely. Only index dates when something actually happened (deaths, incidents, funerals, broadcasts).

FILMS & TV DUAL LISTING — a film or TV programme that is REVIEWED must appear in BOTH the filmsTV and reviews categories. In filmsTV, add a note of the issue and page of the review: "Hagazussa: A Heathen's Curse (2019, Reviewed in FT392:67)". In reviews, give title and author/director as usual.

MAXIMIZE INDEXING — try to index everything that could possibly fall into the categories. When in doubt, include it; the human editor deletes, so a miss is worse than an extra entry.

PARENTHETICAL CONTEXT — add a short qualifier in parentheses to as many entries as possible so a reader knows what the entry refers to. Keep it to a few words, never a sentence. Examples:
- Dates: "1505 (date carved in Creswell cave)", "2019 (visit to Creswell cave)", "40-28,000 yrs ago (British cave art)", "Dusk (time of cult arrival)".
- Places: "Altos del Terron, Panama (cult deaths)".
- Topics: "frozen (lemming)", "caves (dark)", "luck (discovery by)", "engravings (cave art)", "isolation (in cult captivity)".
- Science: "chicken (hostile)", "stag (in British cave art)", "Ice Age (last Great)".
- Fictional: "Hell (entrance to)".
Whenever a date, era or time of day appears, always add a parenthetical note explaining what event or subject it relates to (e.g. "2019 (excavation date)", "Victorian (era of photograph)", "midnight (time of incident)"). Do not leave a bare year or time.
Do not add parentheses when the entry is already self-explanatory, and never repeat the same words twice.


Extract every indexable term into these 10 categories. Follow these rules strictly:


1) people — NAMES of PEOPLE & PEOPLES. Surname first, comma, forenames, then any pseudonym, affiliation, title, profession or distinguishing aspect in brackets (e.g. astronomer, ufo witness, editor, King, Pope, Sir, St., Dr., Prof., Duchess of). For Prof., mention the subject and/or institution. Use "St." for Saint. Keep surname prefixes (de, da, de la, el, le, la, von, van de) with the surname. Add "FT correspondent" or "FT contributor" where indicated. If there is only a surname with no qualification, use "Mr" or "Mrs" as appropriate; if uncertain, omit it. For Peoples include Nation/Tribe/Origin (e.g. Navajo, Celt, Ainu, American).

2) topics — TOPICS + CASENAMES. A general category for observations, reports or discussions of ANY indexable object, subject, word or phrase mentioned on the page. Includes:
   - Very important: ALL internal "see" referrals (e.g. "fox fights eagle, see FT139p43").
   - Casenames (e.g. Bermuda Triangle, Roswell, Atlantis, Skinwalker Ranch, Satanic Panic, Buried Alive, Project Blue Book, The Apollo Program).
   - Strange phenomena generally: ufology, earth mysteries, lost lands/tribes/continents, coincidences & synchronicity, luck, falls (of frogs, fish, stones), strange forces (antigravity, invisible barriers), time travel & time slips, weather anomalies, aerial booms & hums.
   - Unusual consciousness-related experiences: entity encounters (fairies, aliens, gods), night paralysis, savants & memory phenomena, altered consciousness (incl. psychedelics & entheogens), OOBEs & NDEs, sleep & dream phenomena, trance & hypnosis.
   - Cultural, sociological & psychological: witches, shamans, gurus; rituals & festivals; mind control & conspiracies; crime & punishment; religious movements; cults & conspiracy theorists; historical & cultural revision.
   - Spiritual, mystical & folkloric: physical phenomena of mysticism (stigmata, levitation, miracles), ghosts & hauntings (incl. poltergeists), states of consciousness, omens & portents, spontaneous images in nature.
   - Psychology & parapsychology: psychical phenomena (telepathy, remote viewing, clairvoyance, psychokinesis), multiple personality, human stupidity & odd crimes, mass hysteria & collective behaviour, prediction & prophecy, feats, talents & austerities.
   - Human & animal behaviour: swarms & migration, attacks on & attacks by, animal intelligence, outsiders & imposters, sexual oddities.
   - Cryptozoology & cryptobotany; out-of-place creatures; out-of-place objects; exploration & new lands; unclassified remainder.
   - Reactive behaviour words (verbs, nouns & adjectives; e.g. frighten, frightening, frightened).
   - Lists can be indicated here by Title or Subject.

3) organisations — NAMES of ORGANISATIONS and VESSELS: occupations of every kind and occupational organisations. Capture ALL occupations, trades, jobs and roles, not only those regarded as professions (e.g. cleaner, drover, labourer, night watchman, shopkeeper, farmhand, as well as doctor, lawyer, archæologist); religions & sects; societies & institutions; philosophical, political or religious movements; companies & brand names; named vessels, spacecraft and submersibles (manned or unmanned, e.g. The Mary Celeste, Voyager II). Be exhaustive — index EVERY named organisation mentioned anywhere on the page, including ones easily overlooked: publishers and imprints (e.g. Polity Books), technology and internet companies (e.g. Google), websites and online reference works (e.g. Wikipedia), broadcasters, government bodies, universities, and museums. Never skip a named organisation just because it is mentioned only in passing or in a credit line.

4) science — SCIENTIFIC, Medical & Technical: terms from and references to any science, academic discipline or speciality (philosophical & theoretical sciences, empirical sciences, history & anthropology, astronomy & cosmology, medicine & biology, archaeology & palæontology). Include common names AND scientific names of organisms, plants or animals (but omit pet names) — including animals mentioned only inside a mythological or fictional description (e.g. lion, goat, serpent in a description of the Chimera). Include illnesses, elements, stars & planets, processes, materials, equipment, classifications. Also include body parts and biological materials mentioned (fingernails, hand, skin, lips, cheeks, bone marrow, semen), forensic and investigative terms (forensics, forensic evidence (contamination of), contamination (of forensic evidence), paternity dispute, genetic evidence), and academic fields invoked (e.g. mythology (Greek)). Split distinct aspects into separate entries here too: "bone marrow (transfusion of)", "chimerism (caused by DNA transfusion)", "chimerism (implications for law enforcement)".

5) fictional — NAMES (Legendary and Fictional): from mythology, fiction, folklore, legend, fantasy, any religion and modern popular culture. Names of gods, deities, spirits and non-human entities; colloquial, regional, ethnic or tribal names for monsters.

6) places — PLACES: TOWN, COUNTY/STATE/PROVINCE (as appropriate) and COUNTRY only; or significant geographical features (lake, forest, mountain, river). Also fixed, named locations (e.g. Brooklands Racetrack, Chicago-O'Hare Airport). Compound forms like "Halle, East Germany" are fine.

7) dates — DATES & TIMES: year, month, day (when given); durations or extensions (e.g. from 6 June 1978 to 12 January 1979); periods and eras (e.g. the 1800s, the Tudor Period, New Kingdom Egypt, Meiji Era); times of day and light conditions (e.g. dawn, dusk, midnight, noon, 3 AM, "the small hours"); and vague time expressions ("olden times", "nowadays").

8) filmsTV — FILMS & TV: title and date only needed.

9) letters — LETTERS & It Happened To Me: title and correspondent name only. Contents are captured under the other categories as appropriate.

10) reviews — REVIEWS: title and author of the reviewed item.

For EVERY item, also return:
- confidence: "high" | "medium" | "low"
  - "high" — clearly stated on the page, unambiguous, clearly belongs in this category.
  - "medium" — present but wording/spelling/category placement is uncertain.
  - "low" — inferred or possibly an OCR guess.
- context: the exact sentence or short paragraph from the page where the term appears (verbatim quote, 1–3 sentences). If the term is only in a caption/headline list, quote that caption or headline. Keep under 400 characters.
- page: the printed page number of the page where the term appears (see PAGE NUMBERS above).
- reason: a brief (1–2 sentence) explanation of why you placed this term in this specific category, so a human editor can quickly judge inclusion.

Return ONLY JSON matching the schema. Each array contains objects of the form { "text": string, "confidence": "high" | "medium" | "low", "context": string, "reason": string, "page": string }. Do not add commentary. If a category has no items, return an empty array.`;


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
              text: "Extract all indexable keywords from EVERY page of this Fortean Times PDF into the 10 categories (v.30c). Include the printed page number (usually at the bottom of each page) for each item.",
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
                  page: { type: "string" },
                },
                required: ["text", "confidence", "context", "reason", "page"],

              },
            };
            return {
              type: "object",
              additionalProperties: false,
              properties: {
                people: itemSchema,
                topics: itemSchema,
                organisations: itemSchema,
                science: itemSchema,
                fictional: itemSchema,
                places: itemSchema,
                dates: itemSchema,
                filmsTV: itemSchema,
                letters: itemSchema,
                reviews: itemSchema,
              },
              required: [
                "people",
                "topics",
                "organisations",
                "science",
                "fictional",
                "places",
                "dates",
                "filmsTV",
                "letters",
                "reviews",
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
      organisations: [],
      science: [],
      fictional: [],
      places: [],
      dates: [],
      filmsTV: [],
      letters: [],
      reviews: [],
    };
    return { ...empty, ...parsed };
  });
