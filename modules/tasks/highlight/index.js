'use strict';
import config from 'config';
import Bitbucket from '../../bitbucket/Bitbucket.js';
import HighlightMacro from '../../confluence/macro/Highlight.js';
import NoteMacro from '../../confluence/macro/Note.js';
import Template from '../../Template.js';
/**
 * Demonstrate highlighting
 */
export default class Highlight {
  /**
   * Contruct highlight task
   * @constructor
   */
  constructor() {
    this.cwd = `./modules/tasks/highlight`;
  }

  /**
   * Highlight source code
   * @param {string} parent  Parent Confluent page id
   * @param {string} title   Page title
   * @param {string} repo    Bitbucket repo
   * @param {string} path    Bitbucket path
   */
  async execute(parent, title, repo, path) {
    const project = config.get('bitbucket').project.key;
    const bitbucket = new Bitbucket(config.get('bitbucket'));
    const template = new Template();
    const msg = 'This page has been generated. Any manual edits will be lost.';
    const raw = await bitbucket.getFile(project, repo, path)
        .then((response) => response.data);
    const hi = await HighlightMacro.generate('gherkin', `\n${raw}`);

    template.setPageTitle(title);
    template.setParentId(parent);
    template.setTemplatePath(`${this.cwd}/template.hbs`);
    return template.write(
        {notice: NoteMacro.generate('Generated', msg), code: hi},
    );
  }
};
