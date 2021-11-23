'use strict';
/**
 * Confluence note macro
 */
export default class Note {
  /**
   * Generate Confluence note macro
   * @param {string} title - Title for the note
   * @param {string} content - Content  for the note
   * @return {string}
   */
  static generate(title, content) {
    const macroId = 'e9aa7714-b777-445c-9d98-c3ca6bdd48be';
    return `
    <ac:structured-macro
     ac:name="note"
     ac:schema-version="1"
     ac:macro-id="${macroId}">
    <ac:parameter ac:name="title">${title}</ac:parameter>
    <ac:rich-text-body>
    <p>${content}</p>
    </ac:rich-text-body>
    </ac:structured-macro>
    `.trim();
  }
}
