import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { Upload, Loader2, Download, Plus, X, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { extractKeywords, type ExtractionResult } from "@/lib/extract.functions";
import { buildDocxBlob } from "@/lib/build-docx";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Fortean Times Indexer — Keyword Extractor" },
      {
        name: "description",
        content:
          "Upload a Fortean Times page PDF and generate a keyword index sorted into the eight FT indexing categories.",
      },
      { property: "og:title", content: "Fortean Times Indexer" },
      {
        property: "og:description",
        content:
          "Turn scanned FT pages into a formatted keyword index — ready to download as a Word document.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: IndexerPage,
});

type CategoryKey = keyof ExtractionResult;

const CATEGORIES: Array<{ key: CategoryKey; label: string; hint: string }> = [
  { key: "people", label: "Names of People & Peoples", hint: "Surname, forenames (title/role)" },
  { key: "topics", label: "Topics & 'see' referrals", hint: "Subjects, phrases, cross-refs" },
  { key: "science", label: "Scientific / Medical / Technical", hint: "Illnesses, species, materials" },
  { key: "filmsTV", label: "Films & TV", hint: "Title (date)" },
  { key: "letters", label: "Letters", hint: "Title — writer" },
  { key: "fictional", label: "Legendary & Fictional", hint: "Monsters, deities, entities" },
  { key: "organisations", label: "Organisations", hint: "Also professions, ships, companies" },
  { key: "places", label: "Places", hint: "Town, county, country, features" },
];

const EMPTY: ExtractionResult = {
  people: [],
  topics: [],
  science: [],
  filmsTV: [],
  letters: [],
  fictional: [],
  organisations: [],
  places: [],
};

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const s = reader.result as string;
      const comma = s.indexOf(",");
      resolve(comma >= 0 ? s.slice(comma + 1) : s);
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function IndexerPage() {
  const extract = useServerFn(extractKeywords);
  const [file, setFile] = useState<File | null>(null);
  const [pageLabel, setPageLabel] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ExtractionResult | null>(null);

  async function handleExtract() {
    if (!file) {
      toast.error("Choose a PDF first");
      return;
    }
    setLoading(true);
    try {
      const dataBase64 = await fileToBase64(file);
      const res = await extract({ data: { filename: file.name, dataBase64 } });
      setResult(res);
      if (!pageLabel) setPageLabel(file.name.replace(/\.pdf$/i, ""));
      toast.success("Keywords extracted — review and edit before exporting");
    } catch (e) {
      console.error(e);
      toast.error(e instanceof Error ? e.message : "Extraction failed");
    } finally {
      setLoading(false);
    }
  }

  function updateCategory(key: CategoryKey, text: string) {
    if (!result) return;
    const items = text
      .split("\n")
      .map((l) => l.replace(/^\s*[-*•]\s*/, "").trim())
      .filter(Boolean);
    setResult({ ...result, [key]: items });
  }

  async function handleDownload() {
    if (!result) return;
    const blob = await buildDocxBlob(result, pageLabel || "output");
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${pageLabel || "ft-index"}.docx`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="mx-auto max-w-6xl px-6 py-8">
          <h1 className="text-3xl font-semibold tracking-tight">
            Fortean Times Indexer
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Upload a page PDF. The AI reads the whole page and sorts every indexable
            term into the eight FT categories. Edit anything, then export as .docx.
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8 space-y-6">
        <Card className="p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">Page PDF</label>
              <div className="flex items-center gap-3">
                <label className="flex-1 flex items-center gap-2 rounded-md border border-dashed border-input px-3 py-2 cursor-pointer hover:bg-accent">
                  <Upload className="h-4 w-4" />
                  <span className="text-sm truncate">
                    {file ? file.name : "Choose a PDF file…"}
                  </span>
                  <input
                    type="file"
                    accept="application/pdf"
                    className="hidden"
                    onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                  />
                </label>
              </div>
            </div>
            <div className="sm:w-56">
              <label className="text-sm font-medium mb-2 block">
                Page label (for output)
              </label>
              <Input
                placeholder="e.g. FT76p06"
                value={pageLabel}
                onChange={(e) => setPageLabel(e.target.value)}
              />
            </div>
            <Button onClick={handleExtract} disabled={loading || !file}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Extracting…
                </>
              ) : (
                <>
                  <FileText className="h-4 w-4" /> Extract keywords
                </>
              )}
            </Button>
          </div>
        </Card>

        {result && (
          <>
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Review each list. One item per line. Then download the .docx.
              </p>
              <Button onClick={handleDownload}>
                <Download className="h-4 w-4" /> Download .docx
              </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {CATEGORIES.map((cat) => (
                <CategoryCard
                  key={cat.key}
                  label={cat.label}
                  hint={cat.hint}
                  items={result[cat.key]}
                  onChange={(text) => updateCategory(cat.key, text)}
                />
              ))}
            </div>

            <div className="flex justify-end pt-4">
              <Button onClick={handleDownload} size="lg">
                <Download className="h-4 w-4" /> Download .docx
              </Button>
            </div>
          </>
        )}

        {!result && !loading && (
          <Card className="p-10 text-center text-sm text-muted-foreground">
            Upload a PDF page to get started.
          </Card>
        )}
      </main>
    </div>
  );
}

function CategoryCard({
  label,
  hint,
  items,
  onChange,
}: {
  label: string;
  hint: string;
  items: string[];
  onChange: (text: string) => void;
}) {
  return (
    <Card className="p-4">
      <div className="mb-2">
        <h3 className="text-sm font-semibold">{label}</h3>
        <p className="text-xs text-muted-foreground">{hint} · {items.length} items</p>
      </div>
      <Textarea
        value={items.join("\n")}
        onChange={(e) => onChange(e.target.value)}
        rows={Math.max(4, Math.min(items.length + 1, 14))}
        className="font-mono text-xs"
        placeholder="One item per line"
      />
    </Card>
  );
}
