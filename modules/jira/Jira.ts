'use strict';
import axios, { AxiosError, AxiosInstance, AxiosResponse } from 'axios';
import { ServerResponse } from 'http';
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

interface JiraProject {
  expand: string,
  self: string,
  id: number,
  key: string,
  description: string,
  lead: {
    self: string,
    key: string,
    name: string,
    avatarUrls: object,
    displayName: string,
    active: true
  },
  components: object[],
  issueTypes: object[],
  url: string,
  assigneeType: string,
  versions: object[],
  name: string,
  roles: object,
  avatarUrls: object,
  projectTypeKey: string,
  archived: false
}

export { JiraResponse, JiraIssue, JiraProject }

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
    const data: object = {
      'jql': jql,
      'startAt': offset,
      'maxResults': limit,
      'fields': fields,
    };
    return this.axios.post(`rest/api/2/search`, data).then((response: AxiosResponse) => {
      return response;
    }).catch((error: AxiosError) => {
      this.log.error(error.response.data.errorMessages.join())
      process.exit(1)
    })
  }

  async getProject(key: string): Promise<JiraProject> {
    return this.axios.get(`rest/api/2/project/${key}`).then((response: AxiosResponse) => {
      return response.data
    }).catch((error: AxiosError) => {
      this.log.error(error.response.data.errorMessages.join())
      process.exit(1)
    })

  }

  async getIssue(key: string, fields: Array<any>): Promise<JiraIssue> {
    return this.fetch(`issuekey = ${key}`, 0, 1, fields).then((response: AxiosResponse) => {
      return <JiraIssue>(<JiraIssue[]>(<JiraResponse>response.data).issues)[0]
    }).catch((error: AxiosError) => {
      this.log.error(error.response.data.errorMessages.join())
      process.exit(1)
    })
  }

  async countIssues(jql: string): Promise<number> {
    return this.fetch(jql, 0, 1, ['summary']).then((response: AxiosResponse) => {
      return response.data.total;
    }).catch((error: AxiosError) => {
      this.log.error(error.response.data.errorMessages.join())
      process.exit(1)
    })
  }

  async getFieldIdByName(name: string): Promise<string> {
    try {
      const id: string = (<object[]>await this.getFields()).filter((field: object) => field['name'] === name)[0]['id']
      if (id === undefined) {
        throw new Error(`Issue with name '${name}' was not found in list of issues.`);
      }
      return id;
    } catch (error) {
      this.log.error(error.message)
      process.exit(1)
    }
  }

  async getFields(): Promise<object[]> {
    return this.axios.get(`rest/api/2/field`).then((response: AxiosResponse) => {
      return response.data
    }).catch((error: AxiosError) => {
      this.log.error(error.response.data.errorMessages.join())
      process.exit(1)
    })
  }
}