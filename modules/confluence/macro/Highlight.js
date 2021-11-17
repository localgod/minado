'use strict';
import hljs from 'highlight.js/lib/core.js';
/**
 * Confluence highlight macro
 */
export default class Highlight {
  /**
   * Import highlight language
   * @param {string} language - Language to highlight
   * @return {object}
   */
  static async importLanguage(language) {
    const path = `highlight.js/lib/languages/${language}.js`;
    const {default: hll} = await import(path);
    return hll;
  }

  /**
   * Generate Confluence highlight macro
   * @param {string} language - Language to highlight
   * @param {string} content - Code
   * @return {string}
   */
  static async generate(language, content) {
    return Highlight.importLanguage(language).then((hll) => {
      hljs.registerLanguage(language, hll);
      return `
    <ac:structured-macro
     ac:name="highlightjs"
     ac:schema-version="1"
     ac:macro-id="10e1e8a8-ef44-4827-b39c-1271d202cc93">
    <ac:parameter
     ac:name="atlassian-macro-output-type">INLINE</ac:parameter>
    <ac:rich-text-body>
    <p><br /></p></ac:rich-text-body></ac:structured-macro>
    <pre><code class="gherkin">
    ${hljs.highlight(language, content).value}
    </code></pre>
    `;
    }).catch(() => {
      return `<pre><code class="gherkin">
      Error
      </code></pre>`;
    });
  }
};
