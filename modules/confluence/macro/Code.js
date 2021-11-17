'use strict';
/**
 * Confluence code macro
 */
export default class Code {
  /**
   * Generate Confluence code macro
   * @param {object} data - Configuration object
   * @return {string}
   */
  static generate(data) {
    if (typeof data !== object) {
      throw new Error('A configuration object must be provided');
    }

    !data.hasOwnProperty('language') ? data.language = 'bash' : null;
    !data.hasOwnProperty('theme') ? data.theme = 'Midnight' : null;
    !data.hasOwnProperty('title') ? data.title = 'Example' : null;
    !data.hasOwnProperty('content') ?
      new Error('Content must be provided') : null;
    return `
    <ac:structured-macro
     ac:name="code"
     ac:schema-version="1"
     ac:macro-id="06f56d21-c0d4-496d-9551-ea1c03e7a342">
      <ac:parameter ac:name="language">${data.language}</ac:parameter>
      <ac:parameter ac:name="theme">${data.theme}</ac:parameter>
      <ac:parameter ac:name="title">${data.title}</ac:parameter>
      <ac:plain-text-body><![CDATA[${data.content}]]></ac:plain-text-body>
    </ac:structured-macro>
    `.trim();
  }
};
