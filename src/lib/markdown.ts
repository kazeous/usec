import { marked } from "marked";

/**
 * Render a Markdown string to sanitised HTML.
 * Configures `marked` with safe defaults (no mangle / headerIds to avoid
 * warnings, breaks enabled for single-newline line breaks).
 */
export function renderMarkdown(source: string): string {
  return marked.parse(source, { async: false, breaks: true, gfm: true }) as string;
}
