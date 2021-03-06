'use strict';
import { promisify } from 'util';
import { exec } from 'child_process';

/**
 * Git wrapper object
 */
export default class Git {

  /**
   * Clone repo
   * @param {string} url - url to repo
   * @return {object}
   */
  async clone(url:string) {
    const repo = url.slice(url.search(/[^/]*\.git$/), url.search(/\.git$/))
    const e = promisify(exec);
    const path = `./repos/${repo}`;
    return e(`git clone ${url} ${path}`).catch((error:{stderr:string[]}) => {
      if (!error.stderr.includes('already exists')) {
        console.error(error);
      } else {
        return {
          name: repo,
          path: path,
        };
      }
    });
  }
}
