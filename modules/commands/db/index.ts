'use strict';
import Nano from 'nano';
import Jira from '../../jira/Jira.js';
import config from 'config';
import CouchDB from '../../couchdb/CouchDb.js';

export default class Sync {

  private nano: Nano.ServerScope;
  private jira: Jira;
  private db: CouchDB;

  /**
    * Contruct sync task
    * @constructor
    */
  constructor() {
    this.nano = Nano(`http://${process.env.COUCHDB_USER}:${process.env.COUCHDB_PASSWORD}@127.0.0.1:5984`);
    this.jira = new Jira(config.get('jira'));
    this.db = new CouchDB();
  }

  /**
   * Sync code
   * @param projects
   */
  async execute(projects: string[]): Promise<void> {
    const requests: object[] = await this.getJiraIssues(projects)
    const req = [];
     Promise.all(requests).then((response) => {
         response.forEach((issue) => {
           req.push(this.db.add(issue['key'], issue['fields']));
         });
       console.time('Couch storing');
       Promise.all(req).then(() => {
         console.timeEnd('Couch storing');
         console.log(`done`);
       });
     });
    
  }
  private async getJiraIssues(projects: string[]): Promise<object[]> {
    const fields = [
      'summary', 'issuetype', 'status', (await this.jira.getFieldIdByName('Epic Link')), 'labels',
    ];
    console.time('Jira fetching');
    const jql = `project in(${projects.join()}) order by issuekey ASC`;
    const totalNumberOfissues = await this.jira.countIssues(jql);
    const pagesize = 100;
    let i = 0;
    const requests = [];
    while (i < totalNumberOfissues) {
      requests.push(this.jira.fetch(jql, i, pagesize, fields)
        .then((response) => {
          return response['data']['issues'];
        }));
      i = i + pagesize;
    }
    return (await Promise.all(requests).then((r)=> { console.timeEnd('Jira fetching'); return r; }).catch((error) => { console.log(error); process.exit(1); })).flat()
  }
}
