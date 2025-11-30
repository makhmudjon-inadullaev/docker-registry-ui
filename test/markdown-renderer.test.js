import { renderMarkdown } from '../src/scripts/markdown-renderer.js';
import assert from 'assert';

describe('markdown-renderer tests', () => {
  describe('renderMarkdown', () => {
    it('should return empty string for null or undefined input', () => {
      assert.strictEqual(renderMarkdown(null), '');
      assert.strictEqual(renderMarkdown(undefined), '');
      assert.strictEqual(renderMarkdown(''), '');
    });

    it('should render headers', () => {
      assert.ok(renderMarkdown('# Header 1').includes('<h1>Header 1</h1>'));
      assert.ok(renderMarkdown('## Header 2').includes('<h2>Header 2</h2>'));
      assert.ok(renderMarkdown('### Header 3').includes('<h3>Header 3</h3>'));
      assert.ok(renderMarkdown('#### Header 4').includes('<h4>Header 4</h4>'));
      assert.ok(renderMarkdown('##### Header 5').includes('<h5>Header 5</h5>'));
      assert.ok(renderMarkdown('###### Header 6').includes('<h6>Header 6</h6>'));
    });

    it('should render bold text', () => {
      assert.ok(renderMarkdown('**bold**').includes('<strong>bold</strong>'));
      assert.ok(renderMarkdown('__bold__').includes('<strong>bold</strong>'));
    });

    it('should render italic text', () => {
      assert.ok(renderMarkdown('*italic*').includes('<em>italic</em>'));
      assert.ok(renderMarkdown('_italic_').includes('<em>italic</em>'));
    });

    it('should render inline code', () => {
      assert.ok(renderMarkdown('`code`').includes('<code>code</code>'));
    });

    it('should render code blocks', () => {
      const result = renderMarkdown('```js\nconsole.log("test");\n```');
      assert.ok(result.includes('<pre>'));
      assert.ok(result.includes('<code'));
      assert.ok(result.includes('console.log'));
    });

    it('should render links', () => {
      const result = renderMarkdown('[link text](https://example.com)');
      assert.ok(result.includes('<a href="https://example.com"'));
      assert.ok(result.includes('link text'));
    });

    it('should render images', () => {
      const result = renderMarkdown('![alt text](https://example.com/image.png)');
      assert.ok(result.includes('<img src="https://example.com/image.png"'));
      assert.ok(result.includes('alt="alt text"'));
    });

    it('should render unordered lists', () => {
      const result = renderMarkdown('* item 1\n* item 2');
      assert.ok(result.includes('<ul>'));
      assert.ok(result.includes('<li>item 1</li>'));
      assert.ok(result.includes('<li>item 2</li>'));
    });

    it('should render ordered lists', () => {
      const result = renderMarkdown('1. first\n2. second\n3. third');
      assert.ok(result.includes('<ol>'));
      assert.ok(result.includes('<li>first</li>'));
      assert.ok(result.includes('<li>second</li>'));
      assert.ok(result.includes('<li>third</li>'));
    });

    it('should render blockquotes', () => {
      const result = renderMarkdown('> quote text');
      assert.ok(result.includes('<blockquote>'));
      assert.ok(result.includes('quote text'));
    });

    it('should render horizontal rules', () => {
      assert.ok(renderMarkdown('---').includes('<hr>'));
      assert.ok(renderMarkdown('***').includes('<hr>'));
      assert.ok(renderMarkdown('___').includes('<hr>'));
    });

    it('should escape HTML special characters', () => {
      const result = renderMarkdown('<script>alert("xss")</script>');
      assert.ok(!result.includes('<script>'));
      assert.ok(result.includes('&lt;script&gt;'));
    });

    it('should escape quotes in text', () => {
      const result = renderMarkdown('He said "hello" and \'goodbye\'');
      assert.ok(result.includes('&quot;hello&quot;'));
      assert.ok(result.includes('&#x27;goodbye&#x27;'));
    });

    it('should render combined bold and italic', () => {
      assert.ok(renderMarkdown('***bold italic***').includes('<strong><em>bold italic</em></strong>'));
    });

    it('should block javascript: URLs in links', () => {
      const result = renderMarkdown('[click me](javascript:alert("xss"))');
      assert.ok(!result.includes('href="javascript:'));
      assert.ok(result.includes('click me'));
    });

    it('should allow safe URLs in links', () => {
      assert.ok(renderMarkdown('[link](https://example.com)').includes('href="https://example.com"'));
      assert.ok(renderMarkdown('[link](http://example.com)').includes('href="http://example.com"'));
      assert.ok(renderMarkdown('[link](/path/to/page)').includes('href="/path/to/page"'));
      assert.ok(renderMarkdown('[link](./relative)').includes('href="./relative"'));
    });

    it('should render blockquotes with optional whitespace', () => {
      assert.ok(renderMarkdown('>no space').includes('<blockquote>no space</blockquote>'));
      assert.ok(renderMarkdown('> with space').includes('<blockquote>with space</blockquote>'));
    });
  });
});
