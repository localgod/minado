var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import config from 'config';
import Handlebars from 'handlebars';
import Confluence from './confluence/Confluence.js';
import fs from 'fs';
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
    write(templateArgs) {
        return __awaiter(this, void 0, void 0, function* () {
            const confluence = new Confluence(config.get('confluence'));
            const space = config.get('confluence')['space']['key'];
            return confluence.store(space, this.parent, this.title, this.template(templateArgs));
        });
    }
}
;
