import config from 'config';
import Jira from '../../../jira/Jira.js';
import Logger from '../../../Logger.js';
import JiraIssueMacro from '../../../confluence/macro/JiraIssue.js';
import NoteMacro from '../../../confluence/macro/Note.js';
import Template from '../../../Template.js';
/**
 * Generate a epic overview and publish it to Confluence
 */
export default class EpicOverview {

  private cwd: string;
  private log: Logger;
  /**
   * Contruct Epic overview task
   * @constructor
   */
  constructor() {
    this.cwd = `./modules/commands/jira/epic_overview`;
    this.log = new Logger();
  }

  /**
   * Create epic overview
   */
  async execute() {
    const jira = new Jira(config.get('jira'));
    jira.fetchEpics().then((epics) => {
      const p = [];
      let issue: string;
      epics.forEach((issue: string) => {
        p.push(jira.fetchEpicChildren(issue));
      });

      Promise.all(p).then((values) => {
        const epicLinkfieldId: string = config.get('jira')['fieldMapping']['epicLink'];
        const allRelevantIssues: object[] = [];

        values.forEach((res: object[]) => { res.forEach((issue: object[]) => { allRelevantIssues.push(issue); }); });

        const result = {};
        allRelevantIssues.forEach((issue) => {
          const t: any = <{key:string ,fields: string[]}>issue
          const epic: string = t.fields[epicLinkfieldId];
          const key: string = t.key;
          if (result[epic] == undefined) {
            result[epic] = [key];
          } else {
            result[epic].push(key);
          }
        });

        const msg: string = 'This page as generated. Any manual edits will be lost.';
        const epics = [];
        for (const key in result) {
          if (result.hasOwnProperty(key)) {
            const stories: string[] = [];
            for (const j of result[key]) {
              stories.push(JiraIssueMacro.generate(j));
            }
            epics.push({
              epic: JiraIssueMacro.generate(key),
              stories: stories,
            });
          }
        }
        return this.saveToConfluence({ notice: NoteMacro.generate('Generated', msg), epics: epics });
      });

    }).catch((error) => {
      console.error(error);
      this.log.error('Something bad happend while Jira fethcing');
    });
  }

  async saveToConfluence(data: object): Promise<void> {
    const template = new Template();
    template.setPageTitle('Epic overview');
    template.setParentId(config.get('confluence')['space']['rootPageId']);
    template.setTemplatePath(`${this.cwd}/template.hbs`);
    template.setSpaceKey(config.get('confluence')['space']['key']);
    return template.write(data);
  }
}
