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
        const epics1 = await db.getEpics();
        const epics2 = await jira.fetchEpic();
        const equals = (a: string[], b: string[]) => JSON.stringify(a) === JSON.stringify(b);
        console.log(equals(epics1, epics2));
      })
    return h;
}

export { dummy }