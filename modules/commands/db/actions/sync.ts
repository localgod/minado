import { Command } from "commander";
import CouchDB from '../../../couchdb/CouchDb.js';
import Sync from "../index.js";

function sync() {
  const c: CouchDB = new CouchDB();
  const h = new Command('sync').requiredOption('-p --projects <project>', 'Comma separated list of project keys').description('Sync database with Jira').action(async (options) => {
    const s = new Sync();

    c.createDatabase('issues').then((response) => {
      if (response['ok']) {
        console.log(`Database 'issues' created`);
        s.execute(options.projects.split(','))
      } else {
        console.log(`Database 'issues' was not created`);
      }
    })
  });
  return h;
}

export { sync };