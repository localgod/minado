import { Command } from "commander";
import Jira, { JiraIssue } from '../../../jira/Jira.js';
import config from 'config';
import CouchDB from '../../../couchdb/CouchDb.js';

function sync() {
  const db: CouchDB = new CouchDB();
  const h = new Command('sync').requiredOption('-p --projects <project>', 'Comma separated list of project keys').description('Sync database with Jira').action(async (options: { projects: string }) => {
    await db.createDatabase('issues').then(async (response) => {
      if (response['ok']) {
        console.log(`Database 'issues' created`);
        const issues: JiraIssue[] = await getJiraIssues(options.projects.split(','))
        const req = [];
        issues.forEach((issue) => {
          req.push(db.add(issue.key, issue.fields));
        });
        console.time('Couch storing');
        await Promise.all(req).then(() => {
          console.timeEnd('Couch storing');
          console.log(`done`);
        }).catch(error => {
          console.log(error)
        });
      } else {
        console.log(`Database 'issues' was not created`);
      }
    })
  });
  return h;
}

async function getJiraIssues(projects: string[]): Promise<JiraIssue[]> {
  const jira: Jira = new Jira(config.get('jira'));
  const fields = [
    'summary', 'issuetype', 'status', (await jira.getFieldIdByName('Epic Link')), 'labels',
  ];
  console.time('Jira fetching');
  const jql = `project in(${projects.join()}) order by issuekey ASC`;
  const totalNumberOfissues = await jira.countIssues(jql);
  const pagesize = 100;
  let i = 0;
  const requests = [];
  while (i < totalNumberOfissues) {
    requests.push(jira.fetch(jql, i, pagesize, fields)
      .then((response: { data: { issues: [] } }) => {
        return response['data']['issues'] as JiraIssue[];
      }));
    i = i + pagesize;
  }
  return (await Promise.all(requests).then((r) => { console.timeEnd('Jira fetching'); return r as JiraIssue[]; }).catch((error) => { console.log(error); process.exit(1); })).flat()
}

export { sync };