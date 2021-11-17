'use strict';
import config from 'config';
import Jira from '../../jira/Jira.js';
import Logger from '../../Logger.js';
import JiraIssueMacro from '../../confluence/macro/JiraIssue.js';
import NoteMacro from '../../confluence/macro/Note.js';
import Template from '../../Template.js';
/**
 * Generate a epic overview and publish it to Confluence
 */
export default class EpicOverview {
  /**
   * Contruct Epic overview task
   * @constructor
   */
  constructor() {
    this.cwd = `./modules/tasks/epic_overview`;
    this.log = new Logger();
  }
  /**
   * Create epic overview
   */
  async execute() {
    const jira = new Jira(config.get('jira'));
    jira.fetchEpic().then((epics) => {
      const p = [];
      let issue;
      epics.forEach((issue) => {
        p.push(jira.fetchEpicChildren(issue));
      });

      Promise.all(p).then((values) => {
        const awesome = {};
        for (issue of values) {
          if (issue.data.issues.length > 0) {
            let t;
            for (t of issue.data.issues) {
              if (awesome[t.fields.customfield_10006] == undefined) {
                awesome[t.fields.customfield_10006] = [t.key];
              } else {
                awesome[t.fields.customfield_10006].push(t.key);
              }
            }
          }
        }

        const msg = 'This page was generated. Any manual edits will be lost.';
        const epics = [];
        for (const key in awesome) {
          if (awesome.hasOwnProperty(key)) {
            const stories = [];
            for (const j of awesome[key]) {
              stories.push(JiraIssueMacro.generate(j));
            }
            epics.push({
              epic: JiraIssueMacro.generate(key),
              stories: stories,
            });
          }
        }
        const template = new Template();
        template.setPageTitle('Epic overview');
        template.setParentId(182217395);
        template.setTemplatePath(`${this.cwd}/template.hbs`);
        return template.write(
            {notice: NoteMacro.generate('Generated', msg), epics: epics},
        );
      });
    }).catch((error) => {
      console.log(error);
      this.log.error('Something bad happend Jira fethcing');
    });
  }
};
