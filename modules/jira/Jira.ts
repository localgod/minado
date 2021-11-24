'use strict';
import axios, { AxiosInstance, AxiosResponse } from 'axios';
import Logger from '../Logger.js';

const MAX_REQUESTS_COUNT: number = 25;
const INTERVAL_MS: number = 10;
let PENDING_REQUESTS: number = 0;

// Regex search example:
// issueFunction in issueFieldMatch("project = CCOE", "summary", "\\[.*\\].*")

/**
 * Jira access object
 */
export default class Jira {

  private log: Logger;
  private axios: AxiosInstance;
  private config: object;

  /**
   * Contruct Jira access object
   * @constructor
   * @param {object} config - Config options
   */
  constructor(config: object) {
    if (typeof config != 'object') {
      throw new Error('No config object provide for jira');
    }
    this.log = new Logger();
    this.config = config;
    this.axios = axios.create({
      baseURL: `${config['host']}`,
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
      return new Promise((resolve) => {
        const interval: NodeJS.Timer = setInterval(() => {
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
    }, function (error) {
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
  async fetch(jql: string, offset: number, limit: number, fields: Array<string>): Promise<AxiosResponse<any, any>> {
    const data: object = {
      'jql': jql,
      'startAt': offset,
      'maxResults': limit,
      'fields': fields,
    };
    return await this.axios.post(`rest/api/2/search`, data);
  }

  /**
   * Get issue from Jira
   * @param {string} key
   * @param {array}  fields
   * @returns {Promise}
   */
  async getIssue(key: string, fields: Array<any>): Promise<any> {
    return this.fetch(`issuekey  = ${key}`, 0, 1, fields).then((response) => {
      const fields: object = response['data']['issues'][0].fields;
      fields['status'] = fields['status']['name'];
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
   * @return {Promise}
   */
  async countIssues(jql: string): Promise<number> {
    const data: object = {
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
  async getFields(): Promise<AxiosResponse<any, any>> {
    return await this.axios.get(`rest/api/2/field`);
  }

  /**
   * Fetch epic issues
   */
  async fetchEpics(): Promise<any> {
    const epicLinkfieldId: string = this.config['fieldMapping']['epicLink'];
    const projectKeys: string[] = <string[]>this.config['projects'];
    const jql: string = `project in(${projectKeys.join()})
                 and issuetype = epic 
                 and status != closed 
                 order by status ASC`;
    return this.fetch(jql, 0, 1000, [
      'summary',
      'status',
      epicLinkfieldId,
    ])
      .then((response) => {
        const r: string[] = response['data']['issues'].map((issue: object) => {
          return issue['key'];
        });
        return r.sort();
      })
      .catch((error) => {
        console.error(error);
      });
  }

  /**
   * Fetch issues linked to specific epic
   * @param {string} epic - epic issue
   */
  async fetchEpicChildren(epic: string): Promise<object[]> {
    const epicLinkfieldId: string = this.config['fieldMapping']['epicLink'];
    const projectKeys: string[] = <string[]>this.config['projects'];
    const jql: string = `project in(${projectKeys.join()}) 
                 and "epic link" = ${epic}`;
    return await this.fetch(jql, 0, 1000, ['summary', 'status', epicLinkfieldId]).then((response) => {
      return response.data.issues.map(entity => {
        return {'key':entity.key, 'fields': entity.fields}
      });
    }).catch((error) => {
      console.error(error);
    });
  }
}
