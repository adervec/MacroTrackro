// The house translator and formatters (font.js: window.t, appFont.fmt). English is the key;
// without font.js (tests, offline first load) text stays English and numbers use the device locale.
type P = Record<string, string | number>;
type T = ((key: string, p?: P) => string) & { n: (one: string, other: string, n: number, p?: P) => string };
type House = {
  fmt?: { number: (n: number, o?: { max?: number; min?: number }) => string; date: (d: Date, style?: string) => string; custom: (d: Date, o: Intl.DateTimeFormatOptions) => string };
  ready?: Promise<unknown>;
};
const g = globalThis as unknown as { t?: T; appFont?: House };
const interp = (s: string, p?: P) => (p ? s.replace(/\{(\w+)\}/g, (m, k) => (k in p ? String(p[k]) : m)) : s);

export const t: T = Object.assign((key: string, p?: P) => (g.t ? g.t(key, p) : interp(key, p)), {
  n: (one: string, other: string, n: number, p?: P) => (g.t ? g.t.n(one, other, n, p) : interp(n === 1 ? one : other, { n, ...p })),
});

/** A number for the reader: at most `max` decimals, in the shared locale. */
export const num = (n: number, max = 1): string =>
  g.appFont?.fmt ? g.appFont.fmt.number(n, { max }) : n.toLocaleString(undefined, { maximumFractionDigits: max });

/** "Saturday, 21 November" in the shared locale. */
export const longDate = (d: Date): string => {
  const o: Intl.DateTimeFormatOptions = { weekday: "long", month: "long", day: "numeric" };
  return g.appFont?.fmt ? g.appFont.fmt.custom(d, o) : d.toLocaleDateString(undefined, o);
};

/** Resolves once the chosen language's dictionary is loaded (at once without font.js). */
export const i18nReady = (): Promise<unknown> => g.appFont?.ready ?? Promise.resolve();
