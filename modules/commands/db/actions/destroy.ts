import { Command } from "commander";
import CouchDB from '../../../couchdb/CouchDb.js';

function destroy() {
    const c: CouchDB = new CouchDB();
    const h = new Command('destroy');
    h.description('Destroy database')
    h.argument('<dbname>', 'Name of the database to destroy');
    h.action(async (dbname: string) => {
        await c.destroyDatabase(dbname).then((response) => {
            if (response['ok']) {
                console.log(`Database '${dbname}' destroyed`);
            } else {
                console.log(`Database '${dbname}' was not destroyed`);
            }
        })
    })
    return h;
}

export { destroy }