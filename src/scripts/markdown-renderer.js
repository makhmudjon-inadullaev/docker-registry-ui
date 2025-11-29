/*
 * Copyright (C) 2016-2023 Jones Magloire @Joxit
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

/**
 * Simple markdown renderer
 * Supports: headers, bold, italic, code, links, images, lists, blockquotes, horizontal rules
 * @param {string} markdown - Raw markdown text
 * @returns {string} - Rendered HTML
 */
export function renderMarkdown(markdown) {
  if (!markdown) {
    return '';
  }

  // Process blockquotes before escaping (since > is escaped)
  // Allow optional whitespace after > to support both "> text" and ">text"
  let html = markdown.replace(/^>\s*(.*)$/gm, '{{BLOCKQUOTE_START}}$1{{BLOCKQUOTE_END}}');

  html = escapeHtml(html);

  // Restore blockquotes
  html = html.replace(/\{\{BLOCKQUOTE_START\}\}(.*?)\{\{BLOCKQUOTE_END\}\}/g, '<blockquote>$1</blockquote>');
  // Merge consecutive blockquotes
  html = html.replace(/<\/blockquote>\n<blockquote>/g, '\n');

  // Code blocks (must be done before other processing)
  html = html.replace(/```(\w*)\n([\s\S]*?)```/g, (match, lang, code) => {
    return `<pre><code class="language-${lang}">${code.trim()}</code></pre>`;
  });

  // Inline code
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

  // Headers (must be done after code blocks to avoid conflicts)
  html = html.replace(/^######\s+(.*)$/gm, '<h6>$1</h6>');
  html = html.replace(/^#####\s+(.*)$/gm, '<h5>$1</h5>');
  html = html.replace(/^####\s+(.*)$/gm, '<h4>$1</h4>');
  html = html.replace(/^###\s+(.*)$/gm, '<h3>$1</h3>');
  html = html.replace(/^##\s+(.*)$/gm, '<h2>$1</h2>');
  html = html.replace(/^#\s+(.*)$/gm, '<h1>$1</h1>');

  // Horizontal rule
  html = html.replace(/^[-*_]{3,}$/gm, '<hr>');

  // Bold and italic
  html = html.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>');
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
  html = html.replace(/___(.+?)___/g, '<strong><em>$1</em></strong>');
  html = html.replace(/__(.+?)__/g, '<strong>$1</strong>');
  html = html.replace(/_(.+?)_/g, '<em>$1</em>');

  // Images (must be before links) - only allow safe protocols
  html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (match, alt, url) => {
    if (isSafeUrl(url)) {
      return `<img src="${url}" alt="${alt}">`;
    }
    return match; // Return original if URL is unsafe
  });

  // Links - only allow safe protocols
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (match, text, url) => {
    if (isSafeUrl(url)) {
      return `<a href="${url}" target="_blank" rel="noopener noreferrer">${text}</a>`;
    }
    return text; // Return just the text if URL is unsafe
  });

  // Unordered lists - mark items first
  html = html.replace(/^[\*\-]\s+(.*)$/gm, '{{UL_ITEM}}$1{{/UL_ITEM}}');
  
  // Ordered lists - mark items first
  html = html.replace(/^\d+\.\s+(.*)$/gm, '{{OL_ITEM}}$1{{/OL_ITEM}}');
  
  // Wrap consecutive unordered list items
  html = html.replace(/({{UL_ITEM}}.*?{{\/UL_ITEM}}\n?)+/g, (match) => {
    const items = match.replace(/{{UL_ITEM}}(.*?){{\/UL_ITEM}}/g, '<li>$1</li>');
    return '<ul>' + items + '</ul>';
  });
  
  // Wrap consecutive ordered list items
  html = html.replace(/({{OL_ITEM}}.*?{{\/OL_ITEM}}\n?)+/g, (match) => {
    const items = match.replace(/{{OL_ITEM}}(.*?){{\/OL_ITEM}}/g, '<li>$1</li>');
    return '<ol>' + items + '</ol>';
  });

  // Tables
  html = processTable(html);

  // Paragraphs - wrap non-tag text in paragraphs
  html = html.split('\n\n').map(block => {
    block = block.trim();
    if (!block) return '';
    // Don't wrap if already a block element (check for opening tags only)
    if (/^<(h[1-6]|ul|ol|li|pre|blockquote|table|hr|p)[\s>]/.test(block)) {
      return block;
    }
    // Replace single newlines with <br> and wrap in paragraph
    return '<p>' + block.replace(/\n/g, '<br>') + '</p>';
  }).join('\n');

  return html;
}

/**
 * Escape HTML special characters
 * @param {string} text - Raw text
 * @returns {string} - Escaped text
 */
function escapeHtml(text) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
  };
  return text.replace(/[&<>"']/g, char => map[char]);
}

/**
 * Check if a URL uses a safe protocol
 * @param {string} url - URL to validate
 * @returns {boolean} - True if URL is safe
 */
function isSafeUrl(url) {
  if (!url) return false;
  const trimmedUrl = url.trim().toLowerCase();
  // Allow relative URLs, http, https, mailto, and data URLs for images
  return (
    trimmedUrl.startsWith('http://') ||
    trimmedUrl.startsWith('https://') ||
    trimmedUrl.startsWith('mailto:') ||
    trimmedUrl.startsWith('data:image/') ||
    trimmedUrl.startsWith('/') ||
    trimmedUrl.startsWith('./') ||
    trimmedUrl.startsWith('../') ||
    !trimmedUrl.includes(':') // Relative URL without protocol
  );
}

/**
 * Process markdown tables
 * @param {string} html - HTML with table markdown
 * @returns {string} - HTML with rendered tables
 */
function processTable(html) {
  const tableRegex = /^(\|.+\|)\n(\|[-:| ]+\|)\n((?:\|.+\|\n?)+)/gm;
  
  return html.replace(tableRegex, (match, headerRow, separator, bodyRows) => {
    // Parse header - content is already escaped since we call escapeHtml earlier
    // Validate and use slice to extract cells between pipes
    const headerParts = headerRow.split('|');
    const headers = headerParts.length >= 3 ? headerParts.slice(1, -1) : headerParts;
    const headerHtml = headers.map(h => `<th>${h.trim()}</th>`).join('');
    
    // Parse body rows - content is already escaped
    const rows = bodyRows.trim().split('\n');
    const bodyHtml = rows.map(row => {
      const rowParts = row.split('|');
      const cells = rowParts.length >= 3 ? rowParts.slice(1, -1) : rowParts;
      return '<tr>' + cells.map(c => `<td>${c.trim()}</td>`).join('') + '</tr>';
    }).join('');
    
    return `<table><thead><tr>${headerHtml}</tr></thead><tbody>${bodyHtml}</tbody></table>`;
  });
}
