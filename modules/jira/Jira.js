'use strict';
import axios from 'axios';
import Logger from './../Logger.js';

const MAX_REQUESTS_COUNT = 25;
const INTERVAL_MS = 10;
let PENDING_REQUESTS = 0;

// Regex search example:
// issueFunction in issueFieldMatch("project = CCOE", "summary", "\\[.*\\].*")

/**
 * Jira access object
 */
export default class Jira {
  /**
   * Contruct Jira access object
   * @constructor
   * @param {object} config - Config options
   */
  constructor(config) {
    if (typeof config != 'object') {
      throw new Error('No config object provide for jira');
    }
    this.log = new Logger();
    this.config = config;
    this.axios = axios.create({
      baseURL: `${config.host}`,
      headers: {
        'Content-Type': 'application/json',
      },
      proxy: false,
      auth: {
        username: process.env.AD_USERNAME,
        password: process.env.AD_PASSWORD,
      },
    });

    this.axios.interceptors.request.use((config) => {
      return new Promise((resolve, reject) => {
        const interval = setInterval(() => {
          if (PENDING_REQUESTS < MAX_REQUESTS_COUNT) {
            PENDING_REQUESTS++;
            clearInterval(interval);
            resolve(config);
          }
        }, INTERVAL_MS);
      });
    });

    this.axios.interceptors.response.use((response) => {
      PENDING_REQUESTS = Math.max(0, PENDING_REQUESTS - 1);
      return Promise.resolve(response);
    }, function(error) {
      PENDING_REQUESTS = Math.max(0, PENDING_REQUESTS - 1);
      return Promise.reject(error);
    });
  }

  /**
   * Fetch issues
   * @param {string} jql - Jql query
   * @param {number} offset - Result ofsett
   * @param {number} limit - Result limit
   * @param {array} fields - Fields to return
   */
  async fetch(jql, offset, limit, fields) {
    const data = {
      'jql': jql,
      'startAt': offset,
      'maxResults': limit,
      'fields': fields,
    };
    return this.axios.post(`rest/api/2/search`, data);
  }

  /**
   * Get issue from Jira
   * @param {string} key
   * @param {array}  fields
   */
  async getIssue(key, fields) {
    return this.fetch(`issuekey  = ${key}`, 0, 1, fields).then((response) => {
      const fields = response.data.issues[0].fields;
      fields.status = fields.status.name;
      return new Promise((resolve, reject) => {
        resolve({
          key: key,
          fields: fields,
        });
        reject(new Error('Issue not found'));
      });
    });
  }

  /**
   * Count number of issus return by jql query
   * @param {string} jql Jql query
   * @return {number}
   */
  async countIssues(jql) {
    const data = {
      'jql': jql,
      'startAt': 0,
      'maxResults': 1,
      'fields': ['summary'],
    };
    return this.axios.post(`rest/api/2/search`, data).then((response) => {
      return response.data.total;
    });
  }

  /**
   * Get Jira fields
   */
  async getFields() {
    return this.axios.get(`rest/api/2/field`);
  }

  /**
   * Fetch epic issues
   */
  async fetchEpic() {
    const jql = `project = ${this.config.project.key} 
                 and issuetype = epic 
                 and status != closed 
                 order by status ASC`;
    return this.fetch(jql, 0, 1000, [
      'summary',
      'status',
      'customfield_10006',
    ])
        .then((response) => {
          return response.data.issues.map((issue) => {
            return issue.key;
          });
        })
        .catch((error) => {
          console.log(error);
        });
  }

  /**
   * Fetch issues linked to specific epic
   * @param {string} epic - epic issue
   */
  async fetchEpicChildren(epic) {
    const jql = `project = ${this.config.project.key}
                 and "epic link" = ${epic}`;
    return this.fetch(jql, 0, 1000, [
      'summary',
      'status',
      'customfield_10006',
    ])
        .catch((error) => {
          console.log(error);
        });
  }
};
