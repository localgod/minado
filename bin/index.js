#!/usr/bin/env node
import App from '../app.js';
import yargs from 'yargs';
import {hideBin} from 'yargs/helpers';

yargs(hideBin(process.argv))
    .command('epic_overview', 'Generate epic overview', () => {
    }, (argv) => {
      new App(argv.dry).epicOverview();
    })
    .command('highlight_example', 'Highlighting example', () => {
    }, (argv) => {
      new App(argv.dry).highlight();
    })
    .command('sync', 'Sync jira to local couchdb', () => {
    }, (argv) => {
      new App(argv.dry).sync();
    })
    .command('prefixed_issues', 'List of prefixes used in issues', () => {
    }, (argv) => {
      new App(argv.dry).prefixed();
    })
    .command('jira_fields', 'List all jira fields', () => {
    }, (argv) => {
      new App(argv.dry).fields();
    })
    .command('jira_labels', 'List all jira labels', () => {
    }, (argv) => {
      new App(argv.dry).labels();
    })
    .command('dummy', 'work in progress', () => {
    }, (argv) => {
      new App(argv.dry).dummy();
    })
    .option('d', {
      alias: 'dry',
      describe: 'Dry run',
      type: 'boolean',
    })
    .default('d', false)
    .epilog(`Generating confluence pages bases on Jira and git data`)
    .argv;
