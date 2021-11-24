import { Command } from "commander";
import config from "config";
import CouchDB from '../../couchdb/CouchDb.js';
import Jira from "../../jira/Jira.js";

function dummy() {
    const h = new Command('dummy')
    h.description('Dummy operations')
    h.command('compare').description('compare jira with db').action(async () => {
        const db = new CouchDB();
        const jira = new Jira(config.get('jira'));
        //const epics1 = await db.fetchEpics();
        //const epics2 = await jira.fetchEpics();
        const epics1 = await db.fetchEpicChildren('AXP-10021');
        const epics2 = await jira.fetchEpicChildren('AXP-9996');
        const equals = (a: object[], b: object[]) => JSON.stringify(a) === JSON.stringify(b);
        //const equals = (a: string[], b: string[]) => JSON.stringify(a) === JSON.stringify(b);
        //console.log(equals(epics1, epics2));
        console.log(JSON.stringify(epics2))
      })
    return h;
}

export { dummy }