const cache = new Map<string, string>();

/**
 * Reads a color token from :root so charts use the same CSS variables as the
 * rest of the app (SVG attributes set by chart libraries can't use var()).
 */
export function cssVar(name: `--${string}`): string {
  let v = cache.get(name);
  if (v === undefined) {
    v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    cache.set(name, v);
  }
  return v;
}
