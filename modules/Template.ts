import config, { IConfig } from 'config';
import Handlebars from 'handlebars';
import Confluence from './confluence/Confluence.js';
import fs from 'fs';
/**
 * Object for templating output to Confluence with handlebars.
 */
export default class Template {
  private config: IConfig;
  private template: Handlebars.TemplateDelegate;
  private space: string;
  private parent: number;
  private title: string;

  /**
     * Contruct template
     * @constructor
     */
  constructor() {
    this.config = config;
  }

  /**
     * Set path to handlebar template
     * @param {string} path
     */
  setTemplatePath(path: string) {
    this.template = Handlebars.compile(fs.readFileSync(`${path}`, 'utf8'));
  }

  /**
     * Set Confluence parent page id
     * @param {number} id
     */
  setParentId(id: number) {
    this.parent = id;
  }

  /**
     * Set Confluence page title
     * @param {string} title
     */
  setPageTitle(title: string) {
    this.title = title;
  }

  /**
     * Write template to Confluence
     * @param {object} templateArgs
     */
  async write(templateArgs: object) {
    const confluence = new Confluence(config.get('confluence'));
    const space = config.get('confluence')['space']['key'];
    return confluence.store(
      space, this.parent, this.title, this.template(templateArgs),
    );
  }
}
