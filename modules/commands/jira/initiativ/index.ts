import config from 'config';
import Jira from '../../../jira/Jira.js';
import Logger from '../../../Logger.js';
import JiraIssueMacro from '../../../confluence/macro/JiraIssue.js';
import NoteMacro from '../../../confluence/macro/Note.js';
import Template from '../../../Template.js';
import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { inspect } from 'util'
interface JiraResponse {
    expand: string,
    startAt: number,
    maxResults: number,
    total: number,
    issues: JiraIssue[]
}

interface JiraIssue {
    expand: string,
    id: number,
    self: string,
    key: string,
    fields: object
}

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

    /**
     * Contruct Epic overview task
     * @constructor
     */
    constructor() {
        this.cwd = `./modules/commands/jira/initiativ`;
        this.log = new Logger();
        this.jira = new Jira(config.get('jira'));
    }

    private async getEpicsWithlabels(labels: string[]): Promise<AxiosResponse<any, any>> {
        const projectKeys: string[] = <string[]>config.get('jira')['projects'];
        const jql: string = `project in(${projectKeys.join()}) AND issuetype = Epic AND labels in(${labels.join()})`;
        return await this.jira.fetch(jql, 0, 1000, ['summary', 'status'])
    }

    /**
     * Fetch issues linked to specific epic
     * @param {string} epic - epic issue
     */
    private async fetchEpicChildren(epic: string): Promise<AxiosResponse<any, any>> {
        this.epicLinkfieldId = (await this.jira.getFieldIdByName('Epic Link'));
        const projectKeys: string[] = <string[]>config.get('jira')['projects'];
        const jql: string = `project in(${projectKeys.join()}) and "epic link" = ${epic}`;
        return await this.jira.fetch(jql, 0, 1000, ['summary', 'status', this.epicLinkfieldId])
    }

    private async fetchChildren(parent: string): Promise<AxiosResponse<any, any>> {
        const jql: string = `parent = ${parent}`;
        return await this.jira.fetch(jql, 0, 1000, ['summary', 'status', 'parent'])
    }

    public async initiativ(labels: string[]) {
        const result: object = {}
        const epics: JiraIssue[] = (<JiraResponse>(await this.getEpicsWithlabels(labels)).data).issues;
        const requests1: Promise<AxiosResponse<any, any>>[] = epics.map((issue) => { return this.fetchEpicChildren(issue.key); })
        const epicStories: AxiosResponse[] = (await Promise.all(requests1));
        const requests2: Promise<AxiosResponse<any, any>>[] = (epicStories.map((request) => { return request.data.issues })).flat().map((t) => {
            return this.fetchChildren(t.key)
        })

        const storySubTasks: AxiosResponse[] = (await Promise.all(requests2));


        const result2: object = {}

        storySubTasks.map((x) => {
            return (<JiraResponse>x.data).issues.map((z) => {
                return { key: z.key, parent: z.fields['parent']['key'] }
            })
        }).flat().map((m) => {
            if (!result2.hasOwnProperty(m.parent)) {
                result2[m.parent] = []
            }
            result2[m.parent].push(m.key)
        })

        epicStories.map((issue) => {
            const stories: JiraIssue[] = (<JiraResponse>(<JiraResponse>issue.data)).issues;
            stories.map((i) => {
                if (!result.hasOwnProperty(i.fields[this.epicLinkfieldId])) {
                    result[i.fields[this.epicLinkfieldId]] = []
                }

                if (result2.hasOwnProperty(i.key)) {
                    result[i.fields[this.epicLinkfieldId]].push({ [i.key]: result2[i.key] })
                } else {
                    result[i.fields[this.epicLinkfieldId]].push({ [i.key]: [] })
                }
            })
        })

        

        console.log(inspect({ initiatives: labels, tree: result }, false, null))
        //await this.saveToConfluence({ initiatives: labels, tree: result })
    }

    async saveToConfluence(data: object): Promise<void> {
        const template = new Template();
        template.setPageTitle('Initiativ overview');
        template.setParentId(config.get('confluence')['space']['rootPageId']);
        template.setTemplatePath(`${this.cwd}/template.hbs`);
        template.setSpaceKey(config.get('confluence')['space']['key']);
        return template.write(data);
    }
}
