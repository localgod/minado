import axios, { AxiosInstance, AxiosResponse, AxiosError } from 'axios';
import Logger from '../Logger.js';
/**
 * Confluence access object
 */
export default class Confluence {
  private log: Logger;
  private config: any;
  private axios: AxiosInstance;
  /**
   * Contruct Confluence access object
   * @constructor
   * @param {object} config - Config options
   */
  constructor(config: object) {
    this.log = new Logger();
    this.config = config;
    this.axios = axios.create({
      headers: {
        'Content-Type': 'application/json',
      },
      baseURL: `${config['host']}`,
      proxy: false,
      auth: {
        username: process.env.AD_USERNAME,
        password: process.env.AD_PASSWORD,
      },
    });
  }

  /**
   * Create page
   * @param {string} space - Space key
   * @param {number} ancestor - Ancestor id
   * @param {string} title - Page title
   * @param {string} content - Page content
   */
  async createPage(space: string, ancestor: number, title: string, content: string): Promise<AxiosResponse<any, any>> {
    const data = this.marshal(space, title, ancestor, content);
    return this.axios.post(`/rest/api/content`, data).then((response: AxiosResponse) => {
      return response;
    }).catch((error: AxiosError) => {
      this.log.error(error.response.data.message)
      process.exit(1)
    })
  }

  /**
   * Update page
   * @param {string} space - Space key
   * @param {number} ancestor - Ancestor id
   * @param {string} title - Page title
   * @param {number} id - Page id
   * @param {number} version - Page version
   * @param {string} content - Page content
   */
  async updatePage(space: string, ancestor: number, title: string, id: number, version: number, content: string): Promise<AxiosResponse<any, any>> {
    const data = this.marshal(space, title, ancestor, content, version);
    return this.axios.put(`/rest/api/content/${id}`, data).then((response: AxiosResponse) => {
      return response;
    }).catch((error: AxiosError) => {
      this.log.error(error.response.data.errorMessages.join())
      process.exit(1)
    })
  }

  /**
   * Get page
   * @param {string} space - Space key
   * @param {string} title - Page title
   */
  async getPage(space: string, title: string): Promise<AxiosResponse<any, any>> {
    return this.axios.get(
      `/rest/api/content?spaceKey=${space}&title=${title.trim()}&expand=version`,
    ).then((response: AxiosResponse) => {
      return response;
    }).catch((error: AxiosError) => {
      this.log.error(error.response.data.message)
      process.exit(1)
    })
  }

  /**
   * Store page
   * @param {string} space - Space key
   * @param {number} ancestor - Ancestor id
   * @param {string} title - Page title
   * @param {string} content - Page content
   */
  async store(space: string, ancestor: number, title: string, content: string): Promise<void> {

    
    return this.getPage(space, title).then((response) => {
      if (response.data.results.length == 0) {
        this.createPage(space, ancestor, title, content).then((response) => {
          const base = `${response.data['_links'].base}`;
          const webui = `${response.data['_links'].webui}`;
          this.log.info(`Created page: ${base}/${webui}`);
        }).catch((error) => {
          console.error(error);
          this.log.error('Something bad happend with page creation');
        });
      } else {
        const id = response.data.results[0].id;
        const version = response.data.results[0].version.number;
        this.updatePage(space, ancestor, title, id, version, `${content}`)
          .then((response) => {
            const base = `${response.data['_links'].base}`;
            const webui = `${response.data['_links'].webui}`;
            this.log.info(`Updated page: ${base}/${webui}`);
          })
          .catch((error) => {
            console.error(error.response.data.message);
            this.log.error('Something bad happend with page update');
          });
      }
    }).catch((error) => {
      console.error(error);
    });
    
  }

  /**
   * Update page
   * @param {string} space - Space key
   * @param {string} title - Page title
   * @param {number} ancestor - Ancestor id
   * @param {string} content - Page content
   * @param {number} version - Page version
   * @return {object}
   */
  marshal(space: string, title: string, ancestor: number, content: string, version?: number): object {
    const data = {};
    data['type'] = 'page';
    data['title'] = title;
    data['ancestors'] = [{
      'id': ancestor,
    }];
    data['space'] = {
      'key': space,
    };
    data['body'] = {
      'storage': {
        'value': content,
        'representation': 'storage',
      },
    };
    if (version) {
      data['version'] = {
        'number': version + 1,
      };
    }
    return data;
  }
}
