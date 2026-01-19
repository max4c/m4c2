/**
 * Utility to extract headings from MDX content
 */

export interface Heading {
  id: string;
  text: string;
  level: number;
}

/**
 * Extract headings from MDX content string
 * Looks for markdown headings (## Heading, ### Heading, etc.)
 */
export function extractHeadings(content: string, minLevel = 2, maxLevel = 4): Heading[] {
  const headings: Heading[] = [];

  // Match markdown headings: ## Heading or ### Heading etc.
  // Also capture headings with {#custom-id} syntax
  const markdownHeadingRegex = /^(#{1,6})\s+(.+?)(?:\s*\{#([\w-]+)\})?$/gm;

  let match;
  while ((match = markdownHeadingRegex.exec(content)) !== null) {
    const level = match[1].length;

    // Only include headings within the specified level range
    if (level < minLevel || level > maxLevel) {
      continue;
    }

    const text = match[2].trim();
    // Use custom id if provided, otherwise generate from text
    const id = match[3] || text.toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');

    headings.push({ id, text, level });
  }

  return headings;
}
