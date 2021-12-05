import { Command } from "commander";
import config from "config";
import Jira from "../../jira/Jira.js";
import EpicOverview from "./epic_overview/index.js";
import Status from "./status/index.js";
import Prefixed from './prefixed_issues/index.js';
import Labels from './labels/index.js';
import Initiativ from './initiativ/index.js';

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
    })

    h.command('status').description('List all jira status').action(async () => {
      const s = new Status();
      console.log(await s.status());
      
    })
    h.command('initiativ').description('List initiativ').action(async () => {
      const s = new Initiativ();
      await s.initiativ(['Supersubscription'])
      
    })
    return h;
}

export { jira }