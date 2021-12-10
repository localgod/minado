'use strict';
import Nano from 'nano';
import config from 'config';
import Jira from '../jira/Jira.js';

/**
 * Counch DB wrapper
 */
export default class CouchDB {

  private nano: Nano.ServerScope;

  /**
    * Contruct sync task
    * @constructor
    */
  constructor() {
    this.nano = Nano(`http://${process.env.COUCHDB_USER}:${process.env.COUCHDB_PASSWORD}@127.0.0.1:5984`);
  }

  /**
   * Get labels
   */
  public async getLabels(): Promise<object[]> {
    const query = {
      'selector': {
        '_id': {
          '$gt': null,
        },
        'labels': {
          '$ne': [],
        },
      },
      'fields': ['_id', 'labels'],
      'limit': 10000,
    };
    const issues = this.nano.use('issues');
    const response = await issues.find(query);
    return response.docs.map((issue) => {
      return { key: issue._id, labels: issue['labels'] };
    });
  }

  /**
   * Get non-closed epics
   */
  public async fetchEpics(): Promise<string[]> {
    const query: Nano.MangoQuery = {
      'selector': {
        '_id': {
          '$gt': null,
        },
        'issuetype.name': {
          '$eq': 'Epic',
        },
        'status.name': {
          '$ne': 'Closed',
        },
      },
      'fields': ['_id', 'status', 'summary', 'issuetype'],
      'sort': [
        { '_id': 'asc' }
      ],
      'limit': 5000,
    };
    const issues = this.nano.use('issues');
    const response = await issues.find(query);
    return response.docs.map((issue) => {
      return issue._id;
    });
  }

  /**
   * Get non-closed epics
   */
  public async fetchEpicChildren(epic: string): Promise<object[]> {
    const jira: Jira = new Jira(config.get('jira'));
    const epicLinkfieldId: string = (await jira.getFieldIdByName('Epic Link'));

    const query: Nano.MangoQuery = {
      'selector': {
        '_id': {
          '$gt': null,
        },
        [epicLinkfieldId]: {
          '$eq': epic,
        },
      },
      'fields': ['_id', 'status', 'summary', 'issuetype'],
      'sort': [
        { '_id': 'asc' }
      ],
      'limit': 5000,
    };
    const issues = this.nano.use('issues');
    const response = await issues.find(query);
    return response.docs;
  }

  /**
   * Find prefixed issues
   * @returns {Promise}
   */
  public async findPrefixedIssues(projects: string[]): Promise<string[]> {
    const query = {
      'selector': {
        '_id': {
          '$regex': `^(${projects.join('|').toUpperCase()}).*`,
        },
        'summary': {
          '$regex': '^\\[.*\\]',
        },
      },
      'fields': ['_id', 'status', 'summary'],
      'limit': 10000,
    };
    const issues = this.nano.use('issues');
    const response = await issues.find(query);
    const docs = [];
    response.docs.forEach((issue) => {
      const j = issue['summary'].match(/^(\[[^\]]*\])/)[1];
      docs.push(j);
    });
    const result = {};
    docs.forEach((entry) => {
      const key = entry.substring(1, entry.length - 1);
      if (result[key] == undefined) {
        result[key] = 1;
      } else {
        result[key] = result[key] + 1;
      }
    });
    const b = [];
    for (const [key, value] of Object.entries(result)) {
      b.push({ prefix: key, count: value });
    }

    b.sort((a, b) => (a.count < b.count) ? 1 : -1);
    return b;
  }

  /**
    * Add issue
    * @param {string} key     Key
    * @param {object} content Json document
    * @return {Promise}
    */
  async add(key: string, content: Nano.MaybeDocument | Nano.ViewDocument<unknown>): Promise<object> {
    const issues = this.nano.use('issues');
    return issues.get(key).then((response) => {
      content['_rev'] = response._rev;
      return issues.insert(content, key);
    }).catch((error) => {
      return issues.insert(content, key);
    });
  }

  /**
    * Create a database for storing issues
    * @param {string} dbname
    * @return {Promise|object|Error}
    */
  async createDatabase(dbname: string): Promise<object> {
    return this.nano.db.create(dbname).then((response) => {
      return response;
    }).catch((error) => {
      if (error.error == 'file_exists') {
        return { ok: true };
      } else {
        throw new Error(error.reason);
      }
    });
  }

  /**
  * Destroy a database
  * @param {string} dbname
  * @return {Promise}
  */
  async destroyDatabase(dbname: string): Promise<object> {
    return this.nano.db.destroy(dbname).then((response) => {
      return response;
    }).catch((error) => {
      if (error.error == 'file_exists') {
        return { ok: true };
      } else {
        throw new Error(error.reason);
      }
    });
  }
}
