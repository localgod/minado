'use strict';
import config from 'config';
import EpicOverview from './modules/tasks/epic_overview/index.js';
import Highlight from './modules/tasks/highlight/index.js';
import Sync from './modules/tasks/sync/index.js';
import Prefixed from './modules/tasks/prefixed_issues/index.js';
import Labels from './modules/tasks/labels/index.js';
import Jira from './modules/jira/Jira.js';
import Git from './modules/git/Git.js';
import glob from 'glob';
import parser from 'gherkin-parse';
import axios from 'axios';
import tunnel from 'tunnel';
/**
 * Main application
 */
export default class App {
  /**
   * Contruct the app
   * @constructor
   */
  constructor() {
  }

  /**
   * Highlight code file in confluence page
   */
  async highlight() {
    const h = new Highlight();
    const parentId = config.get('confluence').space.rootPageId;
    return h.execute(
        parentId,
        'Highlight',
        `tf-mod-budget`,
        `test/component/gherkin/budget_behaviour.feature`,
    );
  }

  /**
   * Generate epic overview
   */
  async epicOverview() {
    const e = new EpicOverview();
    return e.execute();
  }

  /**
   * Sync to couchdb
   */
  async sync() {
    const s = new Sync();
    return s.execute();
  }

  /**
 * List of prefixes used in issues
 */
  async prefixed() {
    const p = new Prefixed();
    return p.execute();
  }

  /**
* List all Jira fields
*/
  async fields() {
    const jira = new Jira(config.get('jira'));
    return jira.getFields().then((response) => {
      response.data.forEach((field) => {
        console.log(field);
      });
    }).catch((error) => {
      console.error(error);
    });
  }

  /**
* List all Jira fields
*/
  async labels() {
    const l = new Labels();
    return l.execute();
  }
  /**
* Dummy task
*/
  async dummy() {
    const agent = tunnel.httpsOverHttp({
      proxy: {
        host: 'proxy.host',
        port: 80,
      },
    });

    const axe = axios.create({
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/vnd.github.v3+json',
      },
      baseURL: `${config.get('github').host}/orgs/${config.get('github').org.key}/`,
      httpsAgent: agent,
      proxy: false,
      auth: {
        username: process.env.GITHUB_USER,
        password: process.env.GITHUB_PASS,
      },
    });

    axe.get('/repos').then((response) => {
      console.log(response);
    }).catch((error) => {
      console.error(error);
    });
  }

  /**
   * Clone all repositories
   */
  async cloneAll() {
    const repo = `tf-mod-budget`;
    const host = config.get('bitbucket').host;
    const url = `${host}scm/${config.get('bitbucket').project.key}/${repo}.git`;
    const git = new Git();
    return git.clone(url).then((response) => {
      console.log(`${repo}:`);
      glob(`${response.path}/**/*.feature`, {}, (er, files) => {
        if (files.length > 0) {
          files.forEach((file) => {
            const data = parser.convertFeatureFileToJSON(files[0]);
            const s = data.feature.children
                .filter((child) => child.type == 'ScenarioOutline').map((child) => {
                  return child.name;
                });
            console.log(s);
          });
        }
      });
    });
  }
};
