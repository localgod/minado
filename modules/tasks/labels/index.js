'use strict';
import Template from '../../Template.js';
import CouchDB from '../../couchdb/CouchDb.js';
/**
 * Generate a epic overview and publish it to Confluence
 */
export default class LabelOverview {
  /**
   * Contruct Epic overview task
   * @constructor
   */
  constructor() {
    this.cwd = `./modules/tasks/labels`;
  }
  /**
   * Create epic overview
   */
  async execute() {
    const couch = new CouchDB();
    return couch.getLabels().then((response) => {
      const labels = {};
      response.forEach((issue) => {
        issue.labels.forEach((label) => {
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
      template.setPageTitle('Labels overview');
      template.setParentId(182217395);
      template.setTemplatePath(`${this.cwd}/template.hbs`);
      return template.write({labels: b});
    });
  }
};
