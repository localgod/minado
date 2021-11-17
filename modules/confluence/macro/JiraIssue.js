'use strict';
/**
 * Confluence jira issue macro
 */
export default class JiraIssue {
  /**
   * Generate Confluence jira issue macro
   * @param {string} issue - Issue number
   * @return {string}
   */
  static generate(issue) {
    return `
    <ac:structured-macro
     ac:name="jira"
     ac:schema-version="1"
     ac:macro-id="d9e256b5-3459-45c3-9d2e-07e89db25ff2">
     <ac:parameter ac:name="server">JIRA</ac:parameter>
     <ac:parameter ac:name="columns">
       key,summary,type,created,updated,due,assignee,
       reporter,priority,status,resolution
     </ac:parameter>
     <ac:parameter
      ac:name="serverId">c24ff086-e494-378f-8ce6-0f83f863eb1b
     </ac:parameter>
     <ac:parameter ac:name="key">${issue}</ac:parameter>
    </ac:structured-macro>
    `.trim();
  }
};
