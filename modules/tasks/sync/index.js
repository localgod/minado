'use strict';
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import Nano from 'nano';
import Jira from '../../jira/Jira.js';
import config from 'config';
import CouchDB from '../../couchdb/CouchDb.js';
/**
 * Demonstrate sync
 */
export default class Sync {
    /**
      * Contruct sync task
      * @constructor
      */
    constructor() {
        this.nano = Nano(`http://${process.env.COUCHDB_USER}:${process.env.COUCHDB_PASSWORD}@127.0.0.1:5984`);
        this.jira = new Jira(config.get('jira'));
        this.db = new CouchDB();
    }
    /**
      * Sync code
      */
    execute() {
        return __awaiter(this, void 0, void 0, function* () {
            this.db.createDatabase('issues').then((result) => {
                this.syncJiraToCouch();
                //this.updateAllDatabaseEntries();
                //this.destroyDB();
            }).catch((error) => {
                console.error(error);
            });
        });
    }
    destroyDB() {
        return __awaiter(this, void 0, void 0, function* () {
            this.db.destroyDatabase('issues').then((result) => {
                console.log(result['ok']);
            }).catch((error) => {
                console.error(error);
            });
        });
    }
    /**
     * Get all issue from database
     */
    updateAllDatabaseEntries() {
        return __awaiter(this, void 0, void 0, function* () {
            let issues = this.nano.use('issues');
            const total = yield issues.info().then((response) => {
                return response.doc_count;
            });
            let i = 0;
            const rows = yield issues.list().then((body) => {
                return body.rows;
            });
            const entries = [];
            for (i; i < total; i++) {
                entries.push(this.jira.getIssue(rows[i].key, ['summary', 'status'])
                    .then((content) => {
                    this.db.add(content.key, content.fields);
                    console.log(`Updated: ${content.key}`);
                    return content;
                }));
            }
            Promise.all(entries).then((values) => {
                console.log(`done`);
            });
        });
    }
    /**
     * Fetch all issues
     */
    syncJiraToCouch() {
        return __awaiter(this, void 0, void 0, function* () {
            const epicLinkfieldId = config.get('jira')['fieldMapping']['epicLink'];
            const projectKey = config.get('jira')['project']['key'];
            const fields = [
                'summary', 'issuetype', 'status', epicLinkfieldId, 'labels',
            ];
            console.time('Jira fetching');
            const jql = `project = ${projectKey} order by issuekey ASC`;
            const totalNumberOfissues = yield this.jira.countIssues(jql);
            const pagesize = 100;
            let i = 0;
            const requests = [];
            const req = [];
            while (i < totalNumberOfissues) {
                requests.push(this.jira.fetch(jql, i, pagesize, fields)
                    .then((response) => {
                    return response.data.issues;
                }));
                i = i + pagesize;
            }
            Promise.all(requests).then((response) => {
                console.timeEnd('Jira fetching');
                response.forEach((batch) => {
                    batch.forEach((issue) => {
                        req.push(this.db.add(issue.key, issue.fields));
                    });
                });
                console.time('Couch storing');
                Promise.all(req).then(() => {
                    console.timeEnd('Couch storing');
                    console.log(`done`);
                });
            });
        });
    }
}
;
