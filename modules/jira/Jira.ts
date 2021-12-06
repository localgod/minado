'use strict';
import axios, { AxiosInstance, AxiosResponse } from 'axios';
import Logger from '../Logger.js';

const MAX_REQUESTS_COUNT: number = 25;
const INTERVAL_MS: number = 10;
let PENDING_REQUESTS: number = 0;

// Regex search example:
// issueFunction in issueFieldMatch("project = CCOE", "summary", "\\[.*\\].*")


interface JiraResponse {
  expand: string,
  startAt: number,
  maxResults: number,
  total: number,
  issues: JiraIssue[]
}

interface JiraIssue {
  expand: string,
  id: number,
  self: string,
  key: string,
  fields: object
}

export { JiraResponse, JiraIssue }

export default class Jira {

  private log: Logger;
  private axios: AxiosInstance;
  private config: object;

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

   async fetch(jql: string, offset: number, limit: number, fields: Array<string>): Promise<AxiosResponse<any, any>> {
    try {
      const data: object = {
        'jql': jql,
        'startAt': offset,
        'maxResults': limit,
        'fields': fields,
      };
      return await this.axios.post(`rest/api/2/search`, data);
    } catch (error) {
      console.error(error)
    }
  }

  async getIssue(key: string, fields: Array<any>): Promise<JiraIssue> {
    try {
      return (<JiraIssue>(<JiraIssue[]>(<JiraResponse>(<AxiosResponse>await this.fetch(`issuekey = ${key}`, 0, 1, fields)).data).issues)[0]);
    } catch (error) {
      console.error(error)
    }
  }

  async countIssues(jql: string): Promise<number> {
    try {
      const data: object = {
        'jql': jql,
        'startAt': 0,
        'maxResults': 1,
        'fields': ['summary'],
      };
      return this.axios.post(`rest/api/2/search`, data).then((response) => {
        return response.data.total;
      });
    } catch (error) {
      console.error(error)
    }
  }

  async getFieldIdByName(name: string): Promise<any> {
    try {
      const fields: object[] = (await this.getFields()).data;

      const t: object[] = fields.filter((field: object) => { return field['name'] === name });
      if (t[0] !== undefined) {
        return t[0]['id'];
      } else {
        throw new Error(`Issue with name '${name}' was not found in list of issues.`)
      }
    } catch (error) {
      console.error(error)
    }
  }

  async getFields(): Promise<AxiosResponse<any, any>> {
    try {
      return await this.axios.get(`rest/api/2/field`);
    } catch (error) {
      console.error(error)
    }
  }
}
