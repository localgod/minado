import config from 'config';
import Jira, { JiraIssue, JiraResponse, JiraProject } from '../../../../jira/Jira.js';
import Template from '../../../../Template.js';
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
    const p: JiraProject[] = await this.getProjectInfo(projects);
    const chart: string[] = []

    const issues = (await Promise.all((await this.fetchEpics(projects)).map((issue: string) => this.fetchEpicChildren(issue)))).flat();
    const epicLinkfieldId: string = (await this.jira.getFieldIdByName('Epic Link'));
    const result = {}
    issues.forEach((issue: JiraIssue): void => {
      chart.push(issue.key)
      if (!result.hasOwnProperty(issue.fields[epicLinkfieldId])) {
        result[issue.fields[epicLinkfieldId]] = [issue.key];
      } else {
        result[issue.fields[epicLinkfieldId]].push(issue.key);
      }
    })
    const charJql = `issuekey in (${chart.toString()}) ORDER BY status ASC`
    await this.saveToConfluence({ epics: result, projects: p, chart: charJql }, projects.join().toUpperCase());
  }

  private async getProjectInfo(projects: string[]): Promise<JiraProject[]> {
    return Promise.all(projects.map((key) => this.jira.getProject(key.toUpperCase())))
  }

  private async fetchEpics(projects: string[]): Promise<string[]> {
    const jql = `project IN(${projects.join()}) AND issuetype = epic AND status != closed ORDER BY status ASC`;
    const epics: JiraIssue[] = (<JiraResponse>(await this.jira.fetch(jql, 0, 1000, ['summary', 'status', (await this.jira.getFieldIdByName('Epic Link'))])).data).issues
    return epics.map((issue: { key: string }) => issue['key']).sort()
  }

  private async fetchEpicChildren(epic: string): Promise<object[]> {
    const jql = `"epic link" = ${epic} and status not in (closed, Done, Resolved, Cancelled) order by status ASC`;
    const children: JiraIssue[] = (<JiraResponse>(await this.jira.fetch(jql, 0, 1000, ['summary', 'status', (await this.jira.getFieldIdByName('Epic Link'))])).data).issues
    return children.map((entity: JiraIssue) => { return { 'key': entity['key'], 'fields': entity['fields'] } });
  }

  private async saveToConfluence(data: object, title: string): Promise<void> {
    const template = new Template();
    template.setPageTitle(`Epic Overview - ${title}`);
    template.setParentId(config.get('confluence')['space']['rootPageId']);
    template.setTemplatePath(`${this.cwd}/template.hbs`);
    template.setSpaceKey(config.get('confluence')['space']['key']);
    return template.write(data);
  }
}
