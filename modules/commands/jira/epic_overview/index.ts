import { AxiosResponse } from 'axios';
import config from 'config';
import Jira, { JiraIssue, JiraResponse, JiraProject } from '../../../jira/Jira.js';
import Template from '../../../Template.js';
/**
 * Generate a epic overview and publish it to Confluence
 */
export default class EpicOverview {

  private cwd: string;
  private jira: Jira;

  constructor() {
    this.cwd = `./modules/commands/jira/epic_overview`;
    this.jira = new Jira(config.get('jira'));
  }

  async execute(projects: string[]): Promise<void> {
    try {

      const p: JiraProject[] = await this.getProjectInfo(projects);

      const issues = (await Promise.all((<string[]>await this.fetchEpics(projects)).map((issue: string) => this.fetchEpicChildren(issue)))).flat();
      const epicLinkfieldId: string = (await this.jira.getFieldIdByName('Epic Link'));
      const result = {}
      issues.forEach((issue: JiraIssue) => {
        if (!result.hasOwnProperty(issue.fields[epicLinkfieldId])) {
          result[issue.fields[epicLinkfieldId]] = [issue.key];
        } else {
          result[issue.fields[epicLinkfieldId]].push(issue.key);
        }
      })
      await this.saveToConfluence({ epics: result, projects: p });
    } catch (error) {
      console.error(error)
    }
  }

  private async getProjectInfo(projects: string[]): Promise<JiraProject[]> {
    try {
      return await Promise.all(projects.map((key) => this.jira.getProject(key.toUpperCase())))
    } catch (error) {
      console.error(error)
    }
  }

  private async fetchEpics(projects: string[]): Promise<string[]> {
    try {
      const jql: string = `project IN(${projects.join()}) AND issuetype = epic AND status != closed ORDER BY status ASC`;
      const epics: JiraIssue[] = (<JiraResponse>(<AxiosResponse>await this.jira.fetch(jql, 0, 1000, ['summary', 'status', (await this.jira.getFieldIdByName('Epic Link'))])).data).issues
      return epics.map((issue: object) => issue['key']).sort()
    } catch (error) {
      console.error(error);
    }
  }

  private async fetchEpicChildren(epic: string): Promise<object[]> {
    try {
      const jql: string = `"epic link" = ${epic} and status not in (closed, Done, Resolved, Cancelled) order by status ASC`;
      const children: JiraIssue[] = (<JiraResponse>(<AxiosResponse>await this.jira.fetch(jql, 0, 1000, ['summary', 'status', (await this.jira.getFieldIdByName('Epic Link'))])).data).issues
      return children.map((entity: object) => { return { 'key': entity['key'], 'fields': entity['fields'] } });
    } catch (error) {
      console.error(error);
    }
  }

  private async saveToConfluence(data: object): Promise<void> {
    const template = new Template();
    template.setPageTitle('Epic overview');
    template.setParentId(config.get('confluence')['space']['rootPageId']);
    template.setTemplatePath(`${this.cwd}/template.hbs`);
    template.setSpaceKey(config.get('confluence')['space']['key']);
    return template.write(data);
  }
}
