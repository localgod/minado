'use strict';
import CouchDB from '../../couchdb/CouchDb.js';
import Template from '../../Template.js';
import config from 'config';

/**
 * Generete page with list of prefixes use in issue summary.
 */
export default class PrefixedIssues {
  /**
    * Contruct sync task
    * @constructor
    */
  constructor() {
    this.cwd = `./modules/tasks/prefixed_issues`;
  }

  /**
   * Execute task
   */
  async execute() {
    const couch = new CouchDB();
    const template = new Template();
    const parentId = config.get('confluence').space.rootPageId;
    template.setPageTitle('Jira prefix overview');
    template.setParentId(parentId);
    template.setTemplatePath(`${this.cwd}/template.hbs`);
    return template.write({prefixes: await couch.findPrefixedIssues()});
  }
};
