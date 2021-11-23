import { Command } from "commander";
import Nano from 'nano'

function destroy() {
    const h = new Command('destroy');
    h.description('Destroy database')
    h.argument('<dbname>', 'Name of the database to destroy');
    h.action(async (dbname) => {
        const nano: Nano.ServerScope = Nano(`http://${process.env.COUCHDB_USER}:${process.env.COUCHDB_PASSWORD}@127.0.0.1:5984`);
        const result = await nano.db.destroy(dbname)
        if (result['ok']) {
            console.log(`'${dbname}' destroyed`)
        } else {
            console.log(`'${dbname}' not destroyed`)
        }
    })
    return h;
}

export { destroy }