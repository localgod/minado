'use strict';
import config from 'config';
import EpicOverview from './modules/tasks/epic_overview/index.js';
import Sync from './modules/tasks/sync/index.js';
import Prefixed from './modules/tasks/prefixed_issues/index.js';
import Labels from './modules/tasks/labels/index.js';
import Jira from './modules/jira/Jira.js';
import CouchDB from './modules/couchdb/CouchDb.js';

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
* Dummy
*/
  async dummy() {
    const db = new CouchDB();
    const jira = new Jira(config.get('jira'));
    const epics1 = await db.getEpics();
    const epics2 = await jira.fetchEpic();
    const equals = (a, b) => JSON.stringify(a) === JSON.stringify(b);
    console.log(equals(epics1, epics2));
  }
};
