import { Command } from "commander";
import config from "config";
import Jira from "../../jira/Jira.js";
import EpicOverview from "./epic_overview/index.js";
import Prefixed from './prefixed_issues/index.js';
import Labels from './labels/index.js';

function jira() {
    const h = new Command('jira')
    h.description('Jira operations')


    h.command('epicOverview').description('Epic overview').action(() => {
      const p = new EpicOverview();
      p.execute();
    });
    
    h.command('prefixes').description('List all jira prefixes').action(() => {
      const p = new Prefixed();
      p.execute();
    })
    
    h.command('labels').description('List all jira labels').action(() => {
      const p = new Labels();
      p.execute();
    })
    
    h.command('fields').description('List all jira fields').action(async () => {
      const jira = new Jira(config.get('jira'));
      const t:string = await jira.getFieldIdByName('Epic Link');
      console.log(t)
      /*
      jira.getFields().then((response) => {
        response.data.forEach((field: object) => {
          console.log(field);
        });
      }).catch((error) => {
        console.error(error);
      });
      */
    })
    return h;
}

export { jira }