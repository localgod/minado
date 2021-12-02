import { Command } from 'commander';
import { dummy } from '../modules/commands/dummy/dummy.js';
import { jira } from '../modules/commands/jira/jira.js';
import { db } from '../modules/commands/db/db.js';

const program = new Command();
program.addCommand(db());
program.addCommand(dummy());
program.addCommand(jira());
program.parse(process.argv);