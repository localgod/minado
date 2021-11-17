'use strict';
import Nano from 'nano';

/**
 * Counch DB wrapper
 */
export default class CouchDB {
  /**
    * Contruct sync task
    * @constructor
    */
  constructor() {
    this.nano = new Nano(`http://${process.env.COUCHDB_USER}:${process.env.COUCHDB_PASSWORD}@127.0.0.1:5984`);
  }

  /**
   * Get labels
   */
  async getLabels() {
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
      'limit': 5000,
    };
    const issues = this.nano.use('issues');
    const response = await issues.find(query);
    return response.docs.map((issue) => {
      return {key: issue._id, labels: issue.labels};
    });
  }

  /**
   * Get non-closed epics
   */
  async getEpics() {
    const query = {
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
      'limit': 5000,
    };
    const issues = this.nano.use('issues');
    const response = await issues.find(query);
    return response.docs.map((issue) => {
      return issue._id;
    });
  }

  /**
    * Find prefixed issues
    * @return {array}
    */
  async findPrefixedIssues() {
    const query = {
      'selector': {
        '_id': {
          '$gt': null,
        },
        'summary': {
          '$regex': '^\\[.*\\]',
        },
      },
      'fields': ['_id', 'status', 'summary'],
      'limit': 5000,
    };
    this.issues = this.nano.use('issues');
    const response = await this.issues.find(query);
    const docs = [];
    response.docs.forEach((issue) => {
      const j = issue.summary.match(/^(\[[^\]]*\])/)[1];
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
      b.push({prefix: key, count: value});
    }

    b.sort((a, b) => (a.count < b.count) ? 1 : -1);
    return b;
  }

  /**
    * Add issue
    * @param {string} key     Key
    * @param {object} content Json document
    * @return {Promise|object}
    */
  async add(key, content) {
    this.issues = this.nano.use('issues');
    return this.issues.get(key).then((response) => {
      content._rev = response._rev;
      return this.issues.insert(content, key);
    }).catch((error) => {
      return this.issues.insert(content, key);
    });
  }

  /**
    * Create a database for storing issues
    * @param {string} dbname
    * @return {Promise|object|Error}
    */
  async createDatabase(dbname) {
    return this.nano.db.create(dbname).then((response) => {
      return response;
    }).catch((error) => {
      if (error.error == 'file_exists') {
        return {ok: true};
      } else {
        throw new Error(error.reason);
      }
    });
  }
};
