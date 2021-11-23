'use strict';
import Nano from 'nano'
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

  async createDatabase() {
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
  async execute() {
    this.db.createDatabase('issues').then((result) => {
      this.syncJiraToCouch();
      //this.updateAllDatabaseEntries();
    }).catch((error) => {
      console.error(error);
    })
  }

  /**
   * Get all issue from database
   */
  public async updateAllDatabaseEntries(): Promise<void> {
    const issues = this.nano.use('issues');
    const total = await issues.info().then((response) => {
      return response.doc_count;
    });

    let i = 0;

    const rows = await issues.list().then((body) => {
      return body.rows;
    });
    const entries = [];
    for (i; i < total; i++) {
      entries.push(this.jira.getIssue(rows[i].key, ['summary', 'status'])
        .then((content) => {
          this.db.add(content['key'], content['fields']);
          console.log(`Updated: ${content['key']}`);
          return content;
        }));
    }
    Promise.all(entries).then((values) => {
      console.log(`done`);
    });
  }

  /**
   * Fetch all issues
   */
  async syncJiraToCouch() {
    const epicLinkfieldId = config.get('jira')['fieldMapping']['epicLink'];
    const projectKey = config.get('jira')['project']['key'];
    const fields = [
      'summary', 'issuetype', 'status', epicLinkfieldId, 'labels',
    ];
    console.time('Jira fetching');
    const jql = `project = ${projectKey} order by issuekey ASC`;
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
