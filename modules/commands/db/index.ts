'use strict';
import Nano from 'nano';
import Jira from '../../jira/Jira.js';
import config from 'config';
import CouchDB from '../../couchdb/CouchDb.js';



/**
 * Demonstrate sync
 */
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

  async createDatabase(): Promise<void> {
    return this.db.createDatabase('issues').then((response) => {
      if (response['ok']) {
        console.log('Database created');
      } else {
        console.log('Database mot created');
      }
    });
  }
  /**
    * Sync code
    */
  async execute(): Promise<void> {
    this.db.createDatabase('issues').then((result) => {
      this.syncJiraToCouch();
    }).catch((error) => {
      console.error(error);
    });
  }

  /**
   * Fetch all issues
   */
  async syncJiraToCouch(): Promise<void> {
    const epicLinkfieldId = config.get('jira')['fieldMapping']['epicLink'];
    const projectKeys: string[] = <string[]>config.get('jira')['projects'];
    const fields = [
      'summary', 'issuetype', 'status', epicLinkfieldId, 'labels',
    ];
    console.time('Jira fetching');
    const jql = `project in(${projectKeys.join()}) order by issuekey ASC`;
    const totalNumberOfissues = await this.jira.countIssues(jql);
    const pagesize = 100;
    let i = 0;
    const requests = [];
    const req = [];
    while (i < totalNumberOfissues) {
      requests.push(this.jira.fetch(jql, i, pagesize, fields)
        .then((response) => {
          return response['data']['issues'];
        }));
      i = i + pagesize;
    }
    Promise.all(requests).then((response) => {
      console.timeEnd('Jira fetching');
      response.forEach((batch) => {
        batch.forEach((issue) => {
          req.push(this.db.add(issue.key, issue.fields));
        });
      });
      console.time('Couch storing');
      Promise.all(req).then(() => {
        console.timeEnd('Couch storing');
        console.log(`done`);
      });
    });
  }
}
