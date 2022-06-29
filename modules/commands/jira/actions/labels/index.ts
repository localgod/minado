import Template from '../../../../Template.js';
import CouchDB from '../../../../couchdb/CouchDb.js';
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
  async execute(projects: string[]): Promise<void> {
    const couch = new CouchDB();
    return couch.getLabels(projects).then((response) => {
      const labels = {};
      response.forEach((issue: { labels: [] }) => {
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
        b.push({ label: key, count: value });
      }

      b.sort((a, b) => (a.count < b.count) ? 1 : -1);

      const template = new Template();
      template.setPageTitle(`Labels overview - ${projects.join().toUpperCase()}`);
      template.setParentId(config.get('confluence')['space']['rootPageId']);
      template.setTemplatePath(`${this.cwd}/template.hbs`);
      template.setSpaceKey(config.get('confluence')['space']['key']);
      return template.write({ labels: b });
    });
  }
}
