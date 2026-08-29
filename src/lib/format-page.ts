export function formatPageRef(
  page: string | number | undefined | null,
): string {
  if (page == null) return "";
  const s = String(page).trim();
  if (!s) return "";

  // Plain page number -> P-prefixed, two digits (e.g. 8 -> P08, 12 -> P12)
  if (/^\d+$/.test(s)) {
    return `P${s.padStart(2, "0")}`;
  }

  // Single-letter prefix + digits -> normalise to two digits (p8 -> P08, S3 -> S03)
  const prefixed = s.match(/^([A-Za-z])(\d+)$/);
  if (prefixed) {
    return `${prefixed[1].toUpperCase()}${prefixed[2].padStart(2, "0")}`;
  }

  return s;
}
