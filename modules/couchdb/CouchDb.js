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
/**
 * Counch DB wrapper
 */
export default class CouchDB {
    /**
      * Contruct sync task
      * @constructor
      */
    constructor() {
        this.nano = Nano(`http://${process.env.COUCHDB_USER}:${process.env.COUCHDB_PASSWORD}@127.0.0.1:5984`);
    }
    /**
     * Get labels
     */
    getLabels() {
        return __awaiter(this, void 0, void 0, function* () {
            const query = {
                'selector': {
                    '_id': {
                        '$gt': null,
                    },
                    'labels': {
                        '$ne': [],
                    },
                },
                'fields': ['_id', 'labels'],
                'limit': 5000,
            };
            const issues = this.nano.use('issues');
            const response = yield issues.find(query);
            return response.docs.map((issue) => {
                return { key: issue._id, labels: issue['labels'] };
            });
        });
    }
    /**
     * Get non-closed epics
     */
    getEpics() {
        return __awaiter(this, void 0, void 0, function* () {
            const query = {
                'selector': {
                    '_id': {
                        '$gt': null,
                    },
                    'issuetype.name': {
                        '$eq': 'Epic',
                    },
                    'status.name': {
                        '$ne': 'Closed',
                    },
                },
                'fields': ['_id', 'status', 'summary', 'issuetype'],
                'sort': [
                    { '_id': 'asc' }
                ],
                'limit': 5000,
            };
            const issues = this.nano.use('issues');
            const response = yield issues.find(query);
            return response.docs.map((issue) => {
                return issue._id;
            });
        });
    }
    /**
     * Find prefixed issues
     * @returns {Promise}
     */
    findPrefixedIssues() {
        return __awaiter(this, void 0, void 0, function* () {
            const query = {
                'selector': {
                    '_id': {
                        '$gt': null,
                    },
                    'summary': {
                        '$regex': '^\\[.*\\]',
                    },
                },
                'fields': ['_id', 'status', 'summary'],
                'limit': 5000,
            };
            let issues = this.nano.use('issues');
            const response = yield issues.find(query);
            const docs = [];
            response.docs.forEach((issue) => {
                const j = issue['summary'].match(/^(\[[^\]]*\])/)[1];
                docs.push(j);
            });
            const result = {};
            docs.forEach((entry) => {
                const key = entry.substring(1, entry.length - 1);
                if (result[key] == undefined) {
                    result[key] = 1;
                }
                else {
                    result[key] = result[key] + 1;
                }
            });
            const b = [];
            for (const [key, value] of Object.entries(result)) {
                b.push({ prefix: key, count: value });
            }
            b.sort((a, b) => (a.count < b.count) ? 1 : -1);
            return b;
        });
    }
    /**
      * Add issue
      * @param {string} key     Key
      * @param {object} content Json document
      * @return {Promise}
      */
    add(key, content) {
        return __awaiter(this, void 0, void 0, function* () {
            let issues = this.nano.use('issues');
            return issues.get(key).then((response) => {
                content['_rev'] = response._rev;
                return issues.insert(content, key);
            }).catch((error) => {
                return issues.insert(content, key);
            });
        });
    }
    /**
      * Create a database for storing issues
      * @param {string} dbname
      * @return {Promise|object|Error}
      */
    createDatabase(dbname) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.nano.db.create(dbname).then((response) => {
                return response;
            }).catch((error) => {
                if (error.error == 'file_exists') {
                    return { ok: true };
                }
                else {
                    throw new Error(error.reason);
                }
            });
        });
    }
    /**
    * Destroy a database for storing issues
    * @param {string} dbname
    * @return {Promise}
    */
    destroyDatabase(dbname) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.nano.db.destroy(dbname).then((response) => {
                return response;
            }).catch((error) => {
                if (error.error == 'file_exists') {
                    return { ok: true };
                }
                else {
                    throw new Error(error.reason);
                }
            });
        });
    }
}
;
