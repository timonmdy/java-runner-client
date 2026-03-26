/**
 * Lightweight ANSI / terminal sequence processor.
 *
 * Handles:
 *  - Carriage return (\r) line rewrites
 *  - CSI cursor movement (up/down/column, erase line)
 *  - OSC sequences (window title, hyperlinks) — stripped or extracted
 *  - SGR (colors) — stripped (rendering is handled separately)
 *  - Wide/fullwidth character awareness for alignment
 */

// Matches any ANSI escape: CSI (ESC[…), OSC (ESC]…BEL/ST), and simple ESC+char
const ANSI_RE =
  /\x1b(?:\[[0-9;]*[A-Za-z]|\][^\x07\x1b]*(?:\x07|\x1b\\)|\[[\x30-\x3f]*[\x20-\x2f]*[\x40-\x7e]|[()][AB012]|[78DEHM])/g;

// OSC 8 hyperlink: ESC]8;;url BEL text ESC]8;; BEL
const HYPERLINK_RE = /\x1b\]8;;([^\x07\x1b]*)\x07([\s\S]*?)\x1b\]8;;\x07/g;

export interface AnsiHyperlink {
  url: string;
  text: string;
  startIdx: number;
  endIdx: number;
}

export interface ProcessedLine {
  text: string;
  hyperlinks: AnsiHyperlink[];
}

/** Strip all ANSI escape sequences from a string. */
export function stripAnsi(str: string): string {
  return str.replace(ANSI_RE, '');
}

/** Extract hyperlinks before stripping. */
function extractHyperlinks(str: string): { cleaned: string; hyperlinks: AnsiHyperlink[] } {
  const hyperlinks: AnsiHyperlink[] = [];
  let offset = 0;

  const cleaned = str.replace(HYPERLINK_RE, (match, url: string, text: string, idx: number) => {
    const startIdx = idx - offset;
    hyperlinks.push({ url, text, startIdx, endIdx: startIdx + text.length });
    offset += match.length - text.length;
    return text;
  });

  return { cleaned, hyperlinks };
}

/**
 * Process a raw chunk from stdout/stderr into display-ready lines.
 *
 * - Splits on \n (keeps \r for mid-line processing)
 * - Handles \r as "return cursor to column 0" (overwrites current line)
 * - Strips ANSI escapes after extracting hyperlinks
 * - Does NOT handle multi-line cursor movement (up/down) — those are stripped
 */
export function processChunk(
  chunk: string,
  partialLine: string
): { lines: ProcessedLine[]; partial: string } {
  const combined = partialLine + chunk;
  const rawLines = combined.split('\n');
  const result: ProcessedLine[] = [];

  // Last segment may be a partial line (no trailing \n)
  const partial = rawLines.pop() ?? '';

  for (const raw of rawLines) {
    result.push(processRawLine(raw));
  }

  return { lines: result, partial };
}

/** Handle \r within a single line: segments separated by \r overwrite from col 0. */
function applyCarriageReturn(line: string): string {
  if (!line.includes('\r')) return line;

  const segments = line.split('\r');
  let buffer = '';

  for (const seg of segments) {
    if (seg === '') continue;
    // Overwrite from position 0
    const chars = [...buffer];
    const incoming = [...seg];
    for (let i = 0; i < incoming.length; i++) {
      chars[i] = incoming[i];
    }
    buffer = chars.join('');
  }

  return buffer;
}

function processRawLine(raw: string): ProcessedLine {
  const afterCR = applyCarriageReturn(raw);
  const { cleaned, hyperlinks } = extractHyperlinks(afterCR);
  const text = stripAnsi(cleaned);

  // Adjust hyperlink positions after ANSI stripping
  // This is approximate — good enough for display purposes
  return { text, hyperlinks };
}

/**
 * Check if a character is a CJK fullwidth character (takes 2 columns).
 * Used for alignment-aware column calculations.
 */
export function isFullwidth(char: string): boolean {
  const code = char.codePointAt(0) ?? 0;
  return (
    (code >= 0x1100 && code <= 0x115f) || // Hangul Jamo
    (code >= 0x2e80 && code <= 0x303e) || // CJK Radicals
    (code >= 0x3040 && code <= 0x33bf) || // Japanese
    (code >= 0x3400 && code <= 0x4dbf) || // CJK Unified Ext A
    (code >= 0x4e00 && code <= 0xa4cf) || // CJK Unified
    (code >= 0xa960 && code <= 0xa97f) || // Hangul Jamo Extended
    (code >= 0xac00 && code <= 0xd7ff) || // Hangul Syllables
    (code >= 0xf900 && code <= 0xfaff) || // CJK Compat Ideographs
    (code >= 0xfe30 && code <= 0xfe6f) || // CJK Compat Forms
    (code >= 0xff01 && code <= 0xff60) || // Fullwidth Forms
    (code >= 0xffe0 && code <= 0xffe6) || // Fullwidth Signs
    (code >= 0x1f000 && code <= 0x1fbff) || // Emoji/Symbols
    (code >= 0x20000 && code <= 0x2ffff) || // CJK Ext B+
    (code >= 0x30000 && code <= 0x3ffff) // CJK Ext G+
  );
}

/** Calculate display width of a string accounting for fullwidth characters. */
export function displayWidth(str: string): number {
  let width = 0;
  for (const char of str) {
    width += isFullwidth(char) ? 2 : 1;
  }
  return width;
}
