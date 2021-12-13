import config from 'config';
import Jira, { JiraIssue, JiraResponse } from '../../../../jira/Jira.js';
import Logger from '../../../../Logger.js';
import Template from '../../../../Template.js';
import { AxiosResponse } from 'axios';

interface InitiativResult {
    initiatives: string[],
    tree: object
}

/**
 * Generate a epic overview and publish it to Confluence
 */
export default class Initiativ {
    private cwd: string;
    private log: Logger;
    private jira: Jira;
    private epicLinkfieldId: string
    private excludeStatus:string[];
    constructor() {
        this.cwd = `./modules/commands/jira/initiativ`;
        this.log = new Logger();
        this.jira = new Jira(config.get('jira'));
        this.excludeStatus = ['Closed', 'Done', 'Resolved', 'Cancelled']
    }
    private async getEpicsWithlabels(labels: string[]): Promise<AxiosResponse<any, any>> {
        const jql: string = `issuetype = Epic AND labels IN(${labels.join()}) ORDER BY status ASC`;
        return await this.jira.fetch(jql, 0, 1000, ['summary', 'status'])
    }
    private async fetchEpicChildren(epic: string): Promise<AxiosResponse<any, any>> {
        this.epicLinkfieldId = (await this.jira.getFieldIdByName('Epic Link'));
        const jql: string = `"epic link" = ${epic} AND status NOT IN (${this.excludeStatus.join()}) ORDER BY status ASC`;
        return await this.jira.fetch(jql, 0, 1000, ['summary', 'status', this.epicLinkfieldId])
    }
    private async fetchChildren(parent: string): Promise<AxiosResponse<any, any>> {
        const jql: string = `parent = ${parent} AND status NOT IN (${this.excludeStatus.join()}) ORDER BY status ASC`;
        return await this.jira.fetch(jql, 0, 1000, ['summary', 'status', 'parent'])
    }
    private async featchAllChildren(epicStories: AxiosResponse[]): Promise<AxiosResponse[]> {
        const requests: Promise<AxiosResponse<any, any>>[] = (epicStories.map((request) => { return request.data.issues })).flat().map((t) => {
            return this.fetchChildren(t.key)
        })
        return (await Promise.all(requests));
    }
    private async fetchAllEpicChildren(epics: JiraIssue[]): Promise<AxiosResponse[]> {
        const requests: Promise<AxiosResponse<any, any>>[] = epics.map((issue) => { return this.fetchEpicChildren(issue.key); })
        return (await Promise.all(requests));
    }
    private getStorySubTasks(storySubTasks: AxiosResponse[]): object {
        const result: object = []
        storySubTasks.map((x) => {
            return (<JiraResponse>x.data).issues.map((z) => {
                return { key: z.key, parent: z.fields['parent']['key'] }
            })
        }).flat().map((m) => {
            if (!result.hasOwnProperty(m.parent)) {
                result[m.parent] = []
            }
            result[m.parent].push(m.key)
        })
        return result;
    }
    public async execute(labels: string[]) {
        let result: object = {}
        let chartIssues: string[] = []
        const epics: JiraIssue[] = (<JiraResponse>(await this.getEpicsWithlabels(labels)).data).issues;
        const epicStories: AxiosResponse[] = (await this.fetchAllEpicChildren(epics));
        const storySubTasks: object = this.getStorySubTasks((await this.featchAllChildren(epicStories)))

        epicStories.map((issue) => {
            const stories: JiraIssue[] = (<JiraResponse>(<JiraResponse>issue.data)).issues;
            stories.map((i) => {
                chartIssues.push(i.key)
                if (!result.hasOwnProperty(i.fields[this.epicLinkfieldId])) {
                    result[i.fields[this.epicLinkfieldId]] = []
                }

                if (storySubTasks.hasOwnProperty(i.key)) {
                    result[i.fields[this.epicLinkfieldId]].push({ [i.key]: storySubTasks[i.key] })
                } else {
                    result[i.fields[this.epicLinkfieldId]].push({ [i.key]: [] })
                }
            })
        })
        const charJql: string = `issuekey in (${chartIssues.toString()}) ORDER BY status ASC`

        await this.saveToConfluence({ initiatives: labels, tree: result, charJql: charJql, excludeStatus: this.excludeStatus.join() }, labels.toString())
    }

    async saveToConfluence(data: object, title: string): Promise<void> {
        const template = new Template();
        template.setPageTitle(`Initiativ: ${title}`);
        template.setParentId(config.get('confluence')['space']['rootPageId']);
        template.setTemplatePath(`${this.cwd}/template.hbs`);
        template.setSpaceKey(config.get('confluence')['space']['key']);
        return template.write(data);
    }
}
