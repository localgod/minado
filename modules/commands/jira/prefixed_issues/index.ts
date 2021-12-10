'use strict';
import CouchDB from '../../../couchdb/CouchDb.js';
import Template from '../../../Template.js';
import config from 'config';

/**
 * Generete page with list of prefixes use in issue summary.
 */
export default class PrefixedIssues {

  private cwd: string;
  /**
    * Contruct sync task
    * @constructor
    */
  constructor() {
    this.cwd = `./modules/commands/jira/prefixed_issues`;
  }

  async execute(projects: string[]): Promise<void> {
    const couch: CouchDB = new CouchDB();
    const template: Template = new Template();
    template.setPageTitle(`Jira prefix overview - ${projects.join().toUpperCase()}`);
    template.setParentId(config.get('confluence')['space']['rootPageId']);
    template.setTemplatePath(`${this.cwd}/template.hbs`);
    template.setSpaceKey(config.get('confluence')['space']['key']);
    return template.write({ prefixes: await couch.findPrefixedIssues(projects) });
  }
}
