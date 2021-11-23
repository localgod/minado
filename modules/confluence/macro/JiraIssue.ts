'use strict';
/**
 * Confluence Jira issue macro
 */
export default class JiraIssue {
  /**
   * Generate Confluence jira issue macro
   * @param {string} issue - Issue number
   * @return {string}
   */
  static generate(issue: string): string {
    const macroId = 'b694f5bd-e49c-4253-8c92-e82eff75cd71';
    return `
    <ac:structured-macro 
    ac:name="jira" 
    ac:schema-version="1" 
    ac:macro-id="${macroId}">
     <ac:parameter ac:name="key">${issue}</ac:parameter>
   </ac:structured-macro>
    `.trim();
  }
}
