import { Command } from "commander";
import { sync } from './actions/sync.js'
import { destroy } from './actions/destroy.js'
import { create } from './actions/create.js'

function db() {
    const h = new Command('db')
    h.description('Database operations')
    h.addCommand(sync())
    h.addCommand(destroy())
    h.addCommand(create())
    return h;
}

export { db }