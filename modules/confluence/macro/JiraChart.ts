/**
 * Confluence code macro
 */
 export default class JiraChart {
    static generate(jql:string): string {
      const macroId = '4886ad40-b685-41d3-9941-9227ce9519b1';
      
      return `
      <ac:structured-macro ac:name="jirachart" ac:schema-version="1" ac:macro-id="${macroId}">
        <ac:parameter ac:name="border">false</ac:parameter>
        <ac:parameter ac:name="showinfor">true</ac:parameter>
        <ac:parameter ac:name="server">Jira</ac:parameter>
        <ac:parameter ac:name="jql">${jql.replace(/\s/g, '%20')}</ac:parameter>
        <ac:parameter ac:name="statType">statuses</ac:parameter>
        <ac:parameter ac:name="chartType">pie</ac:parameter>
        <ac:parameter ac:name="isAuthenticated">true</ac:parameter>
        <ac:parameter ac:name="serverId">65ec566b-36b9-385b-b3a4-e1e6e8f5ff12</ac:parameter>
      </ac:structured-macro>
      `.trim();
    }
  }
