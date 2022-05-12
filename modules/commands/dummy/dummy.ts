import { Command } from "commander";
import config from "config";
import CouchDB from '../../couchdb/CouchDb.js';
import Jira, { JiraResponse } from "../../jira/Jira.js";
import { AxiosResponse } from "axios";

async function fetchEpicChildren(epic: string): Promise<object[]> {
  try {
    const jira: Jira = new Jira(config.get('jira'));
    const jql = `project in(${(<string[]>this.config['projects']).join()}) and "epic link" = ${epic}`;
    return (<JiraResponse>(await jira.fetch(jql, 0, 1000, ['summary', 'status', (await this.getFieldIdByName('Epic Link'))])).data).issues.map((entity: object) => {
      return { 'key': entity['key'], 'fields': entity['fields'] }
    })

  } catch (error) {
    console.error(error);
  }
}

function dummy() {
  const h = new Command('dummy')
  h.description('Dummy operations')
  h.command('compare').description('compare jira with db').action(async () => {
    const db = new CouchDB();
    const jira = new Jira(config.get('jira'));
    //const epics1 = await db.fetchEpics();
    //const epics2 = await jira.fetchEpics();
    const epics1 = await db.fetchEpicChildren('AXP-10021');
    const epics2 = await fetchEpicChildren('AXP-9996');
    const equals = (a: object[], b: object[]) => JSON.stringify(a) === JSON.stringify(b);
    //const equals = (a: string[], b: string[]) => JSON.stringify(a) === JSON.stringify(b);
    //console.log(equals(epics1, epics2));
    console.log(JSON.stringify(epics2))
  })
  return h;
}

export { dummy }