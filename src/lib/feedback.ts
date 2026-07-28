import type { Confidence, IndexItem } from "@/lib/extract.functions";

export type FeedbackAction =
  | "edit_text"
  | "change_confidence"
  | "delete"
  | "add";

export type FeedbackEvent = {
  id: string;
  timestamp: string;
  pageLabel: string;
  category: string;
  action: FeedbackAction;
  before?: IndexItem | null;
  after?: IndexItem | null;
  reason?: string;
};

const STORAGE_KEY = "ft-indexer-feedback-log";
const ASK_WHY_KEY = "ft-indexer-ask-why";

export function loadFeedback(): FeedbackEvent[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as FeedbackEvent[]) : [];
  } catch {
    return [];
  }
}

export function saveFeedback(events: FeedbackEvent[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
  } catch {
    /* ignore */
  }
}

export function loadAskWhy(): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(ASK_WHY_KEY) === "1";
}

export function saveAskWhy(value: boolean) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(ASK_WHY_KEY, value ? "1" : "0");
}

export function diffCategory(
  category: string,
  pageLabel: string,
  before: IndexItem[],
  after: IndexItem[],
): Omit<FeedbackEvent, "id" | "timestamp" | "reason"> | null {
  if (after.length > before.length) {
    // Find first index that differs
    const idx = after.findIndex((it, i) => !before[i] || before[i] !== it);
    const added = after[idx] ?? after[after.length - 1];
    return { pageLabel, category, action: "add", before: null, after: added };
  }
  if (after.length < before.length) {
    const idx = before.findIndex((it, i) => !after[i] || after[i] !== it);
    const removed = before[idx] ?? before[before.length - 1];
    return { pageLabel, category, action: "delete", before: removed, after: null };
  }
  for (let i = 0; i < before.length; i++) {
    const b = before[i];
    const a = after[i];
    if (b === a) continue;
    if (b.confidence !== a.confidence) {
      return {
        pageLabel,
        category,
        action: "change_confidence",
        before: b,
        after: a,
      };
    }
    if (b.text !== a.text) {
      return { pageLabel, category, action: "edit_text", before: b, after: a };
    }
    // context/reason edits — treat as edit_text-ish; skip to avoid noise
    return { pageLabel, category, action: "edit_text", before: b, after: a };
  }
  return null;
}

export function describeEvent(e: FeedbackEvent): string {
  switch (e.action) {
    case "add":
      return `Added "${e.after?.text ?? ""}" to ${e.category}`;
    case "delete":
      return `Removed "${e.before?.text ?? ""}" from ${e.category}`;
    case "edit_text":
      return `Edited "${e.before?.text ?? ""}" → "${e.after?.text ?? ""}" in ${e.category}`;
    case "change_confidence":
      return `Changed confidence of "${e.after?.text ?? ""}" (${e.before?.confidence} → ${e.after?.confidence}) in ${e.category}`;
  }
}

export function newId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export type { Confidence };

import { supabase } from "@/integrations/supabase/client";

/**
 * Upsert a feedback event to the backend. Fire-and-forget; failures are
 * logged but never surfaced to the editor (the local log is authoritative).
 */
export async function uploadFeedback(event: FeedbackEvent): Promise<void> {
  try {
    const { error } = await supabase.from("feedback_events" as never).upsert(
      {
        client_event_id: event.id,
        page_label: event.pageLabel,
        category: event.category,
        action: event.action,
        before_item: (event.before ?? null) as never,
        after_item: (event.after ?? null) as never,
        reason: event.reason ?? null,
        client_timestamp: event.timestamp,
      } as never,
      { onConflict: "client_event_id" } as never,
    );
    if (error) console.warn("[feedback] upload failed:", error.message);
  } catch (err) {
    console.warn("[feedback] upload error:", err);
  }
}
