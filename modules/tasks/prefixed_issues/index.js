'use strict';
import CouchDB from '../../couchdb/CouchDb.js';
import Template from '../../Template.js';

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
    template.setPageTitle('Jira prefix overview');
    template.setParentId(182217395);
    template.setTemplatePath(`${this.cwd}/template.hbs`);
    return template.write({prefixes: await couch.findPrefixedIssues()});
  }
};
