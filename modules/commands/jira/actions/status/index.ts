import config from 'config';
import Jira from '../../../../jira/Jira.js';
import Logger from '../../../../Logger.js';
import Template from '../../../../Template.js';
/**
 * Generate a epic overview and publish it to Confluence
 */
export default class Status {

  private cwd: string;
  private log: Logger;

  private jira: Jira;
  /**
   * Contruct Epic overview task
   * @constructor
   */
  constructor() {
    this.cwd = `./modules/commands/jira/status`;
    this.log = new Logger();
    this.jira = new Jira(config.get('jira'));

  }

  private async getAllIssues() {
    const epicLinkfieldId: string = (await this.jira.getFieldIdByName('Epic Link'));
    const projectKeys: string[] = <string[]>config.get('jira')['projects'];
    //const jql: string = `project in(${projectKeys}) AND status = "Can not do"`;
    const jql = `project in(${projectKeys})`;
    const numberOfIssues: number = await this.jira.countIssues(jql);
    const requests: Promise<any>[] = []
    let offset = 0;
    const maxPerRequest = 100;

    Array.from(Array(Math.ceil(numberOfIssues / maxPerRequest))).forEach(() => { 
      requests.push(this.jira.fetch(jql, offset, maxPerRequest, ['status']))
      offset = offset + maxPerRequest;
    })
    
    return Promise.all(requests).then((response) => {
      const t:object[] = [];
      response.forEach((resp)=>{
        resp.data.issues.forEach((issue: object)=>{
          t.push(issue);
        })
      })
      return t;
    })
  }

  async status():Promise<object> {
    const issues: any = (await this.getAllIssues());
    const statusList: object = {};
    issues.forEach((issue:object) => {
      const status: string = issue['fields']['status']['name'];
      if (statusList[status] == undefined) {
        statusList[status] = 1
      } else {
        statusList[status] = statusList[status] + 1
      }
    })
    return statusList;
  }

  async saveToConfluence(data: object): Promise<void> {
    const template = new Template();
    template.setPageTitle('Status overview');
    template.setParentId(config.get('confluence')['space']['rootPageId']);
    template.setTemplatePath(`${this.cwd}/template.hbs`);
    template.setSpaceKey(config.get('confluence')['space']['key']);
    return template.write(data);
  }
}
