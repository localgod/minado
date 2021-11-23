import { Command } from "commander";
import CouchDB from '../../../couchdb/CouchDb.js';
function create() {
    const c: CouchDB = new CouchDB();
    const h = new Command('create')
    h.argument('<dbname>', 'Name of the database to create');
    h.description('create database')
    h.action(async (dbname) => {
        c.createDatabase(dbname).then((response) => {
            if (response['ok']) {
                console.log(`Database '${dbname}' created`);
            } else {
                console.log(`Database '${dbname}' was not created`);
            }
        })
    });
    return h;
}
export { create };
