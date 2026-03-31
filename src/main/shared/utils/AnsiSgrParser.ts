// Parses ANSI SGR escape sequences into styled React spans.
// Supports: basic 8/16 colors, bold, dim, italic, underline, reset.

export interface AnsiSpan {
  text: string;
  color?: string;
  bgColor?: string;
  bold?: boolean;
  dim?: boolean;
  italic?: boolean;
  underline?: boolean;
}

const ANSI_REGEX = /\x1b\[([0-9;]*)m/g;

// Standard 8-color palette (30-37 fg, 40-47 bg) + bright variants (90-97, 100-107)
const COLORS: Record<number, string> = {
  30: '#4a4a4a',
  31: '#f87171',
  32: '#4ade80',
  33: '#fbbf24',
  34: '#60a5fa',
  35: '#c084fc',
  36: '#34d399',
  37: '#e8eaf2',
  90: '#6b7094',
  91: '#fca5a5',
  92: '#86efac',
  93: '#fde68a',
  94: '#93c5fd',
  95: '#d8b4fe',
  96: '#6ee7b7',
  97: '#ffffff',
};

const BG_COLORS: Record<number, string> = {
  40: '#4a4a4a',
  41: '#7f1d1d',
  42: '#14532d',
  43: '#78350f',
  44: '#1e3a5f',
  45: '#581c87',
  46: '#134e4a',
  47: '#374151',
  100: '#374151',
  101: '#991b1b',
  102: '#166534',
  103: '#92400e',
  104: '#1d4ed8',
  105: '#7e22ce',
  106: '#0f766e',
  107: '#6b7280',
};

interface SgrState {
  color?: string;
  bgColor?: string;
  bold: boolean;
  dim: boolean;
  italic: boolean;
  underline: boolean;
}

function resetState(): SgrState {
  return { bold: false, dim: false, italic: false, underline: false };
}

function applyCodes(codes: number[], state: SgrState): SgrState {
  let s = { ...state };
  let i = 0;
  while (i < codes.length) {
    const c = codes[i];
    if (c === 0) {
      s = resetState();
    } else if (c === 1) {
      s.bold = true;
    } else if (c === 2) {
      s.dim = true;
    } else if (c === 3) {
      s.italic = true;
    } else if (c === 4) {
      s.underline = true;
    } else if (c === 22) {
      s.bold = false;
      s.dim = false;
    } else if (c === 23) {
      s.italic = false;
    } else if (c === 24) {
      s.underline = false;
    } else if (c === 39) {
      s.color = undefined;
    } else if (c === 49) {
      s.bgColor = undefined;
    } else if (COLORS[c]) {
      s.color = COLORS[c];
    } else if (BG_COLORS[c]) {
      s.bgColor = BG_COLORS[c];
    } else if (c === 38 && codes[i + 1] === 5 && codes[i + 2] !== undefined) {
      // 256-color fg: 38;5;n
      s.color = xterm256(codes[i + 2]);
      i += 2;
    } else if (c === 48 && codes[i + 1] === 5 && codes[i + 2] !== undefined) {
      // 256-color bg: 48;5;n
      s.bgColor = xterm256(codes[i + 2]);
      i += 2;
    } else if (c === 38 && codes[i + 1] === 2 && codes[i + 4] !== undefined) {
      // Truecolor fg: 38;2;r;g;b
      s.color = `rgb(${codes[i + 2]},${codes[i + 3]},${codes[i + 4]})`;
      i += 4;
    } else if (c === 48 && codes[i + 1] === 2 && codes[i + 4] !== undefined) {
      // Truecolor bg: 48;2;r;g;b
      s.bgColor = `rgb(${codes[i + 2]},${codes[i + 3]},${codes[i + 4]})`;
      i += 4;
    }
    i++;
  }
  return s;
}

// xterm 256-color lookup (simplified)
function xterm256(n: number): string {
  if (n < 8) return COLORS[30 + n] ?? '#ffffff';
  if (n < 16) return COLORS[90 + (n - 8)] ?? '#ffffff';
  if (n > 231) {
    const g = Math.round(((n - 232) / 23) * 255);
    return `rgb(${g},${g},${g})`;
  }
  const idx = n - 16;
  const b = idx % 6;
  const g = Math.floor(idx / 6) % 6;
  const r = Math.floor(idx / 36);
  const toV = (v: number) => (v === 0 ? 0 : 55 + v * 40);
  return `rgb(${toV(r)},${toV(g)},${toV(b)})`;
}

export function parseAnsi(text: string): AnsiSpan[] {
  const spans: AnsiSpan[] = [];
  let state = resetState();
  let last = 0;

  for (const match of text.matchAll(ANSI_REGEX)) {
    const idx = match.index!;
    if (idx > last) {
      spans.push({ ...state, text: text.slice(last, idx) });
    }
    const codes = match[1]
      .split(';')
      .map(Number)
      .filter((n) => !isNaN(n));
    state = applyCodes(codes.length ? codes : [0], state);
    last = idx + match[0].length;
  }

  if (last < text.length) {
    spans.push({ ...state, text: text.slice(last) });
  }

  return spans.filter((s) => s.text.length > 0);
}

export function hasAnsi(text: string): boolean {
  return /\x1b\[/.test(text);
}
