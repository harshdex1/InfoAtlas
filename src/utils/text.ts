/**
 * Utility functions for text processing, markdown stripping, and display formatting.
 */

export function stripMarkdown(text?: string | null): string {
  if (!text) return "";
  return text
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/\*(.*?)\*/g, "$1")
    .replace(/^#+\s*/gm, "")
    .replace(/^[-*•]\s*/gm, "")
    .replace(/\[(.*?)\]\(.*?\)/g, "$1")
    .replace(/`/g, "")
    .trim();
}

export function cleanTextSummary(text?: string | null, maxLength = 280): string {
  const clean = stripMarkdown(text);
  if (clean.length <= maxLength) return clean;
  return clean.slice(0, maxLength).trim() + "...";
}
