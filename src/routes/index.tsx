import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useRef, useState } from "react";
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
import { buildHtmlBlob } from "@/lib/build-html";
import { formatPageRef } from "@/lib/format-page";


import {
  diffCategory,
  describeEvent,
  loadAskWhy,
  loadFeedback,
  newId,
  saveAskWhy,
  saveFeedback,
  uploadFeedback,
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
          "Upload a Fortean Times page PDF and generate a keyword index sorted into the ten FT indexing categories.",
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
  { key: "people", label: "Names of People & Peoples", hint: "Surname, forenames (title/role/affiliation)" },
  { key: "topics", label: "Topics + Casenames", hint: "Subjects, casenames, phenomena, behaviour words, 'see' refs" },
  { key: "organisations", label: "Organisations & Vessels", hint: "Professions, religions, societies, companies, named vessels" },
  { key: "science", label: "Scientific / Medical / Technical", hint: "Disciplines, illnesses, species, materials, equipment" },
  { key: "fictional", label: "Legendary & Fictional", hint: "Monsters, deities, spirits, folklore, pop culture" },
  { key: "places", label: "Places", hint: "Town, county/state, country, features, named locations" },
  {
    key: "dates",
    label: "Dates & Times",
    hint: "Years, days, durations, periods, eras & times of day",
  },
  { key: "filmsTV", label: "Films & TV", hint: "Title (date) only" },
  { key: "letters", label: "Letters & It Happened To Me", hint: "Title — correspondent" },
  { key: "reviews", label: "Reviews", hint: "Title — author of reviewed item" },
];

type ExportFormat = "html" | "docx";

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
  const [format, setFormat] = useState<ExportFormat>("html");

  const [result, setResult] = useState<ExtractionResult | null>(null);

  const [askWhy, setAskWhy] = useState(false);
  const [feedback, setFeedback] = useState<FeedbackEvent[]>([]);
  const [pendingEvent, setPendingEvent] = useState<FeedbackEvent | null>(null);
  const [reasonDraft, setReasonDraft] = useState("");

  const [dragActive, setDragActive] = useState(false);

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
      // Store locally immediately; upload happens once the reason step is
      // resolved (save or skip) so the row reaches the backend with the
      // final reason attached.
      persistFeedback([...feedback, event]);
      setPendingEvent(event);
      setReasonDraft("");
    } else {
      persistFeedback([...feedback, event]);
      void uploadFeedback(event);
    }
  }

  function handleReasonSave() {
    if (!pendingEvent) return;
    const reason = reasonDraft.trim();
    const updated: FeedbackEvent = {
      ...pendingEvent,
      reason: reason || undefined,
    };
    const next = feedback.map((e) => (e.id === pendingEvent.id ? updated : e));
    persistFeedback(next);
    void uploadFeedback(updated);
    setPendingEvent(null);
    setReasonDraft("");
  }

  function handleReasonSkip() {
    if (pendingEvent) void uploadFeedback(pendingEvent);
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

  async function handleDownload(fmt: ExportFormat = format) {
    if (!result) return;
    const label = pageLabel || "ft-index";
    const blob =
      fmt === "html"
        ? buildHtmlBlob(result, pageLabel || "output")
        : await buildDocxBlob(result, pageLabel || "output");
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${label}.${fmt}`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
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
            Upload a page or a multi-page PDF. The AI reads every page, records
            the printed page number, sorts every indexable term into the ten FT
            categories, and marks each with a confidence rating. Edit anything, then export as HTML (default) or .docx.
          </p>
          <Link
            to="/categories"
            className="mt-3 inline-block text-sm font-medium underline underline-offset-4 hover:text-foreground"
          >
            See the ten keyword categories and examples
          </Link>
        </div>
      </header>


      <main className="mx-auto max-w-6xl px-6 py-8 space-y-6">
        <Card className="p-4 flex flex-wrap items-center gap-4">
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
                Every change is uploaded automatically to help me learn. Turn
                on "why" to add a brief reason to each change (with a Skip
                option).
              </span>
            </label>
          </div>
        </Card>

        <Card
          className={cn("p-6 transition-colors", dragActive && "border-primary bg-primary/5")}
          onDragOver={(e) => {
            e.preventDefault();
            setDragActive(true);
          }}
          onDragLeave={(e) => {
            e.preventDefault();
            setDragActive(false);
          }}
          onDrop={(e) => {
            e.preventDefault();
            setDragActive(false);
            const dropped = e.dataTransfer.files?.[0];
            if (dropped && dropped.type === "application/pdf") {
              setFile(dropped);
              const base = dropped.name.replace(/\.pdf$/i, "");
              setPageLabel(`${base} Indexed`);
            } else if (dropped) {
              toast.error("Please drop a PDF file");
            }
          }}
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">
                PDF (single or multi-page)
              </label>
              <div className="flex items-center gap-3">
                <label className="flex-1 flex items-center gap-2 rounded-md border border-dashed border-input px-3 py-2 cursor-pointer hover:bg-accent">
                  <Upload className="h-4 w-4" />
                  <span className="text-sm truncate">
                    {file ? file.name : "Choose or drop a PDF file…"}
                  </span>
                  <input
                    type="file"
                    accept="application/pdf"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0] ?? null;
                      setFile(f);
                      if (f) {
                        const base = f.name.replace(/\.pdf$/i, "");
                        setPageLabel(`${base} Indexed`);
                      }
                    }}
                  />
                </label>
              </div>
            </div>
            <div className="sm:w-56">
              <label className="text-sm font-medium mb-2 block">
                Output Label
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
              <div className="flex items-center gap-2">
                <div className="flex rounded-md border border-input p-0.5">
                  {(["html", "docx"] as ExportFormat[]).map((f) => (
                    <button
                      key={f}
                      type="button"
                      onClick={() => setFormat(f)}
                      className={cn(
                        "rounded px-3 py-1 text-xs font-medium",
                        format === f
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:text-foreground",
                      )}
                    >
                      .{f}
                    </button>
                  ))}
                </div>
                <Button onClick={() => handleDownload()}>
                  <Download className="h-4 w-4" /> Download .{format}
                </Button>
              </div>

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
              <Button
                variant="outline"
                size="lg"
                onClick={() => handleDownload(format === "html" ? "docx" : "html")}
              >
                <Download className="h-4 w-4" />{" "}
                Download .{format === "html" ? "docx" : "html"}
              </Button>
              <Button onClick={() => handleDownload()} size="lg">
                <Download className="h-4 w-4" /> Download .{format}
              </Button>

            </div>
          </>
        )}

        {!result && !loading && (
          <Card className="p-10 text-center text-sm text-muted-foreground">
            Upload a PDF (single page or multi-page) to get started.
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
  onCommit,
}: {
  label: string;
  hint: string;
  items: IndexItem[];
  onChange: (items: IndexItem[]) => void;
  onCommit: (before: IndexItem[], after: IndexItem[]) => void;
}) {
  // Snapshot of items when the currently-focused text input received focus.
  // Used to defer feedback recording until the edit is committed (blur).
  const editSnapshotRef = useRef<IndexItem[] | null>(null);

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
    const before = items;
    const after = items.filter((_, idx) => idx !== i);
    onChange(after);
    onCommit(before, after);
  }
  function changeConfidenceAt(i: number) {
    const before = items;
    const after = items.map((it, idx) =>
      idx === i ? { ...it, confidence: nextConfidence(it.confidence) } : it,
    );
    onChange(after);
    onCommit(before, after);
  }
  function add() {
    // Just add the row; commit happens on blur if the user actually typed something.
    onChange([
      ...items,
      {
        text: "",
        confidence: "high",
        context: "",
        reason: "Manually added by editor.",
        page: "",
      },
    ]);
  }

  function handleTextFocus() {
    editSnapshotRef.current = items;
  }
  function handleTextBlur(i: number) {
    const before = editSnapshotRef.current;
    editSnapshotRef.current = null;
    if (!before) return;
    const current = items[i];
    // Skip empty adds (user clicked Add then blurred without typing).
    if (!current || !current.text.trim()) {
      // If this was a newly added empty row, silently drop it from state.
      if (before.length < items.length && !current?.text.trim()) {
        onChange(items.filter((_, idx) => idx !== i));
      }
      return;
    }
    const beforeItem = before[i];
    if (beforeItem && beforeItem.text === current.text) return;
    onCommit(before, items);
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
                onClick={() => changeConfidenceAt(i)}
                className={cn(
                  "h-3 w-3 shrink-0 rounded-full ring-1 ring-inset ring-black/10",
                  styles.dot,
                )}
              />

              <input
                value={item.text}
                onChange={(e) => updateAt(i, { text: e.target.value })}
                onFocus={handleTextFocus}
                onBlur={() => handleTextBlur(i)}
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
                      {item.page ? (
                        <>
                          {" "}· Page: <span className="font-medium">{formatPageRef(item.page)}</span>
                        </>
                      ) : null}

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
