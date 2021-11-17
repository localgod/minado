'use strict';
import config from 'config';
import Handlebars from 'handlebars';
import Confluence from './confluence/Confluence.js';
import * as fs from 'fs';
/**
 * Object for templating output to Confluence with handlebars.
 */
export default class Template {
  /**
     * Contruct template
     * @constructor
     */
  constructor() {
    this.config = config;
    this.template = undefined;
    this.space = undefined;
    this.parent = undefined;
    this.title = undefined;
  }

  /**
     * Set path to handlebar template
     * @param {string} path
     */
  setTemplatePath(path) {
    this.template = Handlebars.compile(fs.readFileSync(`${path}`, 'utf8'));
  }

  /**
     * Set Confluence parent page id
     * @param {number} id
     */
  setParentId(id) {
    this.parent = id;
  }

  /**
     * Set Confluence page title
     * @param {string} title
     */
  setPageTitle(title) {
    this.title = title;
  }

  /**
     * Write template to Confluence
     * @param {object} templateArgs
     */
  async write(templateArgs) {
    const confluence = new Confluence(config.get('confluence'));
    const space = config.get('confluence').space.key;
    return confluence.store(
        space, this.parent, this.title, this.template(templateArgs),
    );
  }
};
