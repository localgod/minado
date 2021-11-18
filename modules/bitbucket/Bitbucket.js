'use strict';
import axios from 'axios';


/**
 * Bitbucket access object
 */
export default class Bitbucket {
  /**
     * Contruct Bitbucket access object
     * @constructor
     * @param {object} config - Config options
     */
  constructor(config) {
    this.config = config;
    this.axios = axios.create({
      headers: {
        'Content-Type': 'application/json',
      },
      baseURL: `${config.host}`,
      proxy: false,
      auth: {
        username: process.env.AD_USERNAME,
        password: process.env.AD_PASSWORD,
      },
    });
  }

  /**
     * Get file
     * @param {string} space - Space key
     * @param {string} repo - Repo slug
     * @param {string} path - File path
     * @return {object}
     */
  async getFile(space, repo, path) {
    const params = `?at=refs%2Fheads%2Fmaster`;
    const url = `/projects/${space}/repos/${repo}/raw/${path}${params}`;
    return this.axios.get(url).then((response) => {
      return {
        path: `${this.axios.defaults.baseURL}${path}`,
        data: response.data,
      };
    }).catch((error) => {
      console.error(error);
    });
  }
};
