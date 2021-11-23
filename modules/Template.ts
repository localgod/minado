import config from 'config';
import Handlebars from 'handlebars';
import Confluence from './confluence/Confluence.js';
import fs from 'fs';
/**
 * Object for templating output to Confluence with handlebars.
 */
export default class Template {
  private confluence: Confluence;
  private template: Handlebars.TemplateDelegate;
  private space: string;
  private parent: number;
  private title: string;

  constructor() {
    this.confluence = new Confluence(config.get('confluence'));
  }

  setTemplatePath(path: string): void {
    this.template = Handlebars.compile(fs.readFileSync(`${path}`, 'utf8'));
  }

  setParentId(id: number): void {
    this.parent = id;
  }

  setPageTitle(title: string): void {
    this.title = title;
  }


  setSpaceKey(key: string): void {
    this.space = key;
  }

  async write(templateArgs: object): Promise<void> {
    return this.confluence.store(
      this.space, this.parent, this.title, this.template(templateArgs),
    );
  }
}
