import { toHTML, type PortableTextOptions } from '@portabletext/to-html';
import type { PortableTextBlock } from '@portabletext/types';

const components: PortableTextOptions['components'] = {
  marks: {
    italicDisplay: ({ children }) =>
      `<em class="italic-display">${children}</em>`,
    em: ({ children }) =>
      `<em>${children}</em>`,
    strong: ({ children }) =>
      `<strong>${children}</strong>`,
    link: ({ value, children }) => {
      const href = value?.href ?? '#';
      const external = value?.external;
      const rel = external ? ' rel="noopener"' : '';
      const target = external ? ' target="_blank"' : '';
      return `<a href="${href}"${target}${rel}>${children}</a>`;
    },
  },
  block: {
    lede: ({ children }) => `<p class="lede">${children}</p>`,
    blockquote: ({ children }) => `<blockquote>${children}</blockquote>`,
  },
};

export function renderRichText(blocks: PortableTextBlock[] | null | undefined): string {
  if (!blocks || blocks.length === 0) return '';
  return toHTML(blocks, { components });
}

// For headlines that are stored as Portable Text but we want only the inline
// markup (italic emphasis) — no wrapping <p> tags. Strips the outer block.
export function renderInline(blocks: PortableTextBlock[] | null | undefined): string {
  const html = renderRichText(blocks);
  // Replace block-level wrappers with line breaks so headlines stay one element.
  return html
    .replace(/<\/p>\s*<p[^>]*>/g, '<br />')
    .replace(/^<p[^>]*>/, '')
    .replace(/<\/p>$/, '');
}
