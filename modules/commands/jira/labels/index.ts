import Template from '../../../Template.js';
import CouchDB from '../../../couchdb/CouchDb.js';
import config from 'config';
/**
 * Generate a epic overview and publish it to Confluence
 */
export default class LabelOverview {
  private cwd: string;
  /**
   * Contruct Epic overview task
   * @constructor
   */
  constructor() {
    this.cwd = `./modules/commands/jira/labels`;
  }
  /**
   * Create epic overview
   */
  async execute() {
    const couch = new CouchDB();
    return couch.getLabels().then((response) => {
      const labels = {};
      response.forEach((issue) => {
        issue['labels'].forEach((label: string | number) => {
          if (labels[label] == undefined) {
            labels[label] = 1;
          } else {
            labels[label] = labels[label] + 1;
          }
        });
      });

      const b = [];
      for (const [key, value] of Object.entries(labels)) {
        b.push({label: key, count: value});
      }

      b.sort((a, b) => (a.count < b.count) ? 1 : -1);

      const template = new Template();
      const parentId = config.get('confluence')['space']['rootPageId'];
      template.setPageTitle('Labels overview');
      template.setParentId(parentId);
      template.setTemplatePath(`${this.cwd}/template.hbs`);
      return template.write({labels: b});
    });
  }
}
