import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Upload, Loader2, Download, FileText, Plus, X, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

import {
  extractKeywords,
  type ExtractionResult,
  type IndexItem,
  type Confidence,
} from "@/lib/extract.functions";
import { buildDocxBlob } from "@/lib/build-docx";
import {
  diffCategory,
  describeEvent,
  loadAskWhy,
  loadFeedback,
  newId,
  saveAskWhy,
  saveFeedback,
  type FeedbackEvent,
} from "@/lib/feedback";
import ftLogoAsset from "@/assets/FT_Indexing_Assistant_Image_r1.png.asset.json";


export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Fortean Times Indexing Assistant — Keyword Extractor" },
      {
        name: "description",
        content:
          "Upload a Fortean Times page PDF and generate a keyword index sorted into the eight FT indexing categories.",
      },
      { property: "og:title", content: "Fortean Times Indexing Assistant" },
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

const CONFIDENCE_ORDER: Confidence[] = ["high", "medium", "low"];

const CONFIDENCE_STYLES: Record<
  Confidence,
  { row: string; dot: string; label: string }
> = {
  high: {
    row: "bg-green-500/10 border-green-500/40 focus-within:border-green-500",
    dot: "bg-green-500",
    label: "High confidence",
  },
  medium: {
    row: "bg-yellow-400/10 border-yellow-500/40 focus-within:border-yellow-500",
    dot: "bg-yellow-500",
    label: "Needs review",
  },
  low: {
    row: "bg-muted border-border focus-within:border-muted-foreground/60",
    dot: "bg-muted-foreground",
    label: "Low confidence",
  },
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

  const [askWhy, setAskWhy] = useState(false);
  const [feedback, setFeedback] = useState<FeedbackEvent[]>([]);
  const [pendingEvent, setPendingEvent] = useState<FeedbackEvent | null>(null);
  const [reasonDraft, setReasonDraft] = useState("");

  // Load persisted feedback + toggle on mount
  useEffect(() => {
    setAskWhy(loadAskWhy());
    setFeedback(loadFeedback());
  }, []);

  function persistFeedback(next: FeedbackEvent[]) {
    setFeedback(next);
    saveFeedback(next);
  }

  function recordEvent(base: Omit<FeedbackEvent, "id" | "timestamp" | "reason">) {
    const event: FeedbackEvent = {
      ...base,
      id: newId(),
      timestamp: new Date().toISOString(),
    };
    if (askWhy) {
      // Store immediately (without reason) so nothing is lost if the user closes the tab.
      persistFeedback([...feedback, event]);
      setPendingEvent(event);
      setReasonDraft("");
    } else {
      persistFeedback([...feedback, event]);
    }
  }

  function handleReasonSave() {
    if (!pendingEvent) return;
    const reason = reasonDraft.trim();
    const next = feedback.map((e) =>
      e.id === pendingEvent.id ? { ...e, reason: reason || undefined } : e,
    );
    persistFeedback(next);
    setPendingEvent(null);
    setReasonDraft("");
  }

  function handleReasonSkip() {
    setPendingEvent(null);
    setReasonDraft("");
  }

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

  function setCategory(key: CategoryKey, items: IndexItem[]) {
    if (!result) return;
    setResult({ ...result, [key]: items });
  }

  function recordCategoryChange(
    key: CategoryKey,
    before: IndexItem[],
    after: IndexItem[],
  ) {
    const diff = diffCategory(key, pageLabel || file?.name || "unknown", before, after);
    if (diff) recordEvent(diff);
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

  function handleDownloadFeedback() {
    const blob = new Blob([JSON.stringify(feedback, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ft-indexer-feedback-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  function handleClearFeedback() {
    if (feedback.length === 0) return;
    if (!window.confirm(`Clear ${feedback.length} feedback entries?`)) return;
    persistFeedback([]);
    toast.success("Feedback log cleared");
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="mx-auto max-w-6xl px-6 py-8 text-center">
          <img
            src={ftLogoAsset.url}
            alt="FT Indexing Assistant logo"
            className="mx-auto mb-4 h-48 w-auto"
          />
          <h1 className="text-3xl font-semibold tracking-tight">
            Fortean Times Indexing Assistant
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Upload a page PDF. The AI reads the whole page, sorts every indexable
            term into the eight FT categories, and marks each with a confidence
            rating. Edit anything, then export as .docx.
          </p>
        </div>
      </header>


      <main className="mx-auto max-w-6xl px-6 py-8 space-y-6">
        <Card className="p-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Switch
              id="ask-why"
              checked={askWhy}
              onCheckedChange={(v) => {
                setAskWhy(v);
                saveAskWhy(v);
              }}
            />
            <label htmlFor="ask-why" className="text-sm cursor-pointer">
              <span className="font-medium">Ask "why" for each change</span>
              <span className="ml-2 text-muted-foreground">
                All edits are recorded automatically to help me learn, but
                asking "why" helps me learn more. When on, you'll be asked for a
                brief reason (with a Skip option).
              </span>
            </label>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>{feedback.length} feedback entries</span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadFeedback}
              disabled={feedback.length === 0}
            >
              <Download className="h-3.5 w-3.5" /> Export log
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearFeedback}
              disabled={feedback.length === 0}
            >
              Clear
            </Button>
          </div>
        </Card>

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
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                <span className="font-medium text-foreground">Confidence:</span>
                {CONFIDENCE_ORDER.map((c) => (
                  <span key={c} className="flex items-center gap-1.5">
                    <span
                      className={cn(
                        "inline-block h-2.5 w-2.5 rounded-full",
                        CONFIDENCE_STYLES[c].dot,
                      )}
                    />
                    {CONFIDENCE_STYLES[c].label}
                  </span>
                ))}
                <span className="ml-2">Click the dot to cycle confidence.</span>
              </div>
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
                  onChange={(items) => setCategory(cat.key, items)}
                  onCommit={(before, after) =>
                    recordCategoryChange(cat.key, before, after)
                  }
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

      <Dialog
        open={!!pendingEvent}
        onOpenChange={(open) => {
          if (!open) handleReasonSkip();
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Why did you make this change?</DialogTitle>
            <DialogDescription>
              {pendingEvent ? describeEvent(pendingEvent) : ""}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Textarea
              autoFocus
              placeholder="e.g. wrong category, not indexable, OCR misread, duplicate…"
              value={reasonDraft}
              onChange={(e) => setReasonDraft(e.target.value)}
              rows={3}
            />
            <p className="text-xs text-muted-foreground">
              The change is already saved. This note just helps improve future
              extractions.
            </p>
          </div>
          <DialogFooter className="gap-2 sm:gap-2">
            <Button variant="ghost" onClick={handleReasonSkip}>
              Skip
            </Button>
            <Button onClick={handleReasonSave}>Save reason</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function nextConfidence(c: Confidence): Confidence {
  const i = CONFIDENCE_ORDER.indexOf(c);
  return CONFIDENCE_ORDER[(i + 1) % CONFIDENCE_ORDER.length];
}

function CategoryCard({
  label,
  hint,
  items,
  onChange,
}: {
  label: string;
  hint: string;
  items: IndexItem[];
  onChange: (items: IndexItem[]) => void;
}) {
  const counts = items.reduce(
    (acc, it) => {
      acc[it.confidence]++;
      return acc;
    },
    { high: 0, medium: 0, low: 0 } as Record<Confidence, number>,
  );

  function updateAt(i: number, patch: Partial<IndexItem>) {
    onChange(items.map((it, idx) => (idx === i ? { ...it, ...patch } : it)));
  }
  function removeAt(i: number) {
    onChange(items.filter((_, idx) => idx !== i));
  }
  function add() {
    onChange([
      ...items,
      { text: "", confidence: "high", context: "", reason: "Manually added by editor." },
    ]);
  }


  return (
    <Card className="p-4">
      <div className="mb-3 flex items-start justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold">{label}</h3>
          <p className="text-xs text-muted-foreground">
            {hint} · {items.length} items
          </p>
        </div>
        <div className="flex items-center gap-2 text-[10px] font-medium">
          <span className="flex items-center gap-1">
            <span className="inline-block h-2 w-2 rounded-full bg-green-500" />
            {counts.high}
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block h-2 w-2 rounded-full bg-yellow-500" />
            {counts.medium}
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block h-2 w-2 rounded-full bg-muted-foreground" />
            {counts.low}
          </span>
        </div>
      </div>

      <ul className="space-y-1.5">
        {items.map((item, i) => {
          const styles = CONFIDENCE_STYLES[item.confidence];
          return (
            <li
              key={i}
              className={cn(
                "flex items-center gap-2 rounded-md border px-2 py-1 transition-colors",
                styles.row,
              )}
            >
              <button
                type="button"
                title={`${styles.label} — click to change`}
                onClick={() =>
                  updateAt(i, { confidence: nextConfidence(item.confidence) })
                }
                className={cn(
                  "h-3 w-3 shrink-0 rounded-full ring-1 ring-inset ring-black/10",
                  styles.dot,
                )}
              />
              <input
                value={item.text}
                onChange={(e) => updateAt(i, { text: e.target.value })}
                className="flex-1 bg-transparent text-xs font-mono outline-none"
              />
              <Dialog>
                <DialogTrigger asChild>
                  <button
                    type="button"
                    title="Show context from PDF"
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <Info className="h-3.5 w-3.5" />
                  </button>
                </DialogTrigger>
                <DialogContent className="max-w-lg">
                  <DialogHeader>
                    <DialogTitle className="font-mono text-sm">
                      {item.text || "(empty)"}
                    </DialogTitle>
                    <DialogDescription>
                      Category: <span className="font-medium">{label}</span> · Confidence:{" "}
                      <span className="font-medium">{item.confidence}</span>
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 text-sm">
                    <div>
                      <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">
                        Context from page
                      </div>
                      <blockquote className="border-l-2 border-border pl-3 italic text-foreground/90 whitespace-pre-wrap">
                        {item.context?.trim()
                          ? item.context
                          : "No context captured for this item."}
                      </blockquote>
                    </div>
                    <div>
                      <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">
                        Why it was included
                      </div>
                      <p className="text-foreground/90 whitespace-pre-wrap">
                        {item.reason?.trim() || "No reason provided."}
                      </p>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
              <button
                type="button"
                onClick={() => removeAt(i)}
                className="text-muted-foreground hover:text-foreground"
                title="Remove"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </li>
          );
        })}
      </ul>


      <button
        type="button"
        onClick={add}
        className="mt-2 flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
      >
        <Plus className="h-3.5 w-3.5" /> Add item
      </button>
    </Card>
  );
}
