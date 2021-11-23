import { Command } from "commander";
import Sync from "../index.js"

function sync() {
    const h = new Command('sync').description('Sync database with Jira').action(() => {
        const s = new Sync();
        s.createDatabase();
        //s.execute();
      })
    return h;
}

export { sync }