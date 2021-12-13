import { Command } from "commander";
import config from "config";
import Jira, { JiraProject } from "../../jira/Jira.js";
import EpicOverview from "./actions/epic_overview/index.js";
import Status from "./actions/status/index.js";
import Prefixed from './actions/prefixed_issues/index.js';
import Labels from './actions/labels/index.js';
import Initiativ from './actions/initiativ/index.js';

const jira: Function = () => {
  const h = new Command('jira')
  h.description('Jira operations')

  h.command('epicOverview').description('Epic overview').requiredOption('-p --projects <project>', 'Comma separated list of project keys').action(async (options) => {
    const p = new EpicOverview();
    p.execute(options.projects.split(','));
  });

  h.command('prefixes').description('List all jira prefixes').requiredOption('-p --projects <project>', 'Comma separated list of project keys').action(async (options) => {
    const p = new Prefixed();
    p.execute(options.projects.split(','));
  })

  h.command('labels').description('List all jira labels').requiredOption('-p --projects <project>', 'Comma separated list of project keys').action( async (options) => {
    const p = new Labels();
    p.execute(options.projects.split(','));
  })

  h.command('fields').description('List all jira fields').action(async () => {
    const jira = new Jira(config.get('jira'));
    const t: string = await jira.getFieldIdByName('Epic Link');
  })

  h.command('status').description('List all jira status').action(async () => {
    const s = new Status();
    console.log(await s.status());
  })

  h.command('initiativ').description('List initiativ').requiredOption('-l --labels <label>').action(async (options) => {
    const s = new Initiativ();
    await s.execute(options.labels.split(','));
  })

  h.command('project').description('List project info').requiredOption('-p --project <project>').action(async (options) => {
    const jira: Jira = new Jira(config.get('jira'));
    const t: JiraProject = await jira.getProject(options.project)
    console.log(t.lead.name)
  })
  return h;
}

export { jira }