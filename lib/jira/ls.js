"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDefaultCreate = exports.lsCommand = void 0;
/*
 * ./bin/jira.js jql -c "assignee=currentUser()" -s status
 * ./bin/jira.js jql -j 1  "reporter=currentUser() and status='done' and createdDate>'2017-01-01' and createdDate<'2018-04-01'"
 * ./bin/jira.js jql -j 1  "assignee=currentUser() and createdDate>'2017-01-01' and createdDate<'2018-04-01'"
 * */
const cli_table_1 = __importDefault(require("cli-table"));
const config_1 = __importDefault(require("../config"));
const chalk_1 = __importDefault(require("chalk"));
const async_1 = __importDefault(require("async"));
const alasql_1 = __importDefault(require("alasql"));
const ssl_request_1 = __importDefault(require("../ssl_request"));
const helpers_1 = require("../helpers/helpers");
const inquirer_1 = __importDefault(require("inquirer"));
const lsCommand = (prog, extCallback) => {
    prog
        .command('ls')
        .description('List my issues')
        .option('-p, --project <name>', 'Filter by project', String)
        .option('-t, --type <type>', 'Filter by type', String)
        .option('-v, --verbose', 'verbose output')
        .action(async (options) => {
        // const defaultCreate = await getDefaultCreate();
        // return;
        let err, results;
        try {
            results = await lsEntry(options);
            displayIssues(results.issues);
        }
        catch (e) {
            err = e;
        }
        finally {
            //invoke callback with results/andor error
            extCallback(err, results);
        }
    });
};
exports.lsCommand = lsCommand;
const getDefaultCreate = async (meta) => {
    const askfields = config_1.default['default_create']['__always_ask']['fields'];
    if (!askfields)
        return;
    const answers = [];
    for (const prop in askfields) {
        const answer = await inquirer_1.default.prompt({
            name: prop,
            message: `what is ${prop}`,
            type: 'input',
            default: null
        });
        if (answer[prop])
            answers.push(answer);
    }
    return answers;
};
exports.getDefaultCreate = getDefaultCreate;
async function lsEntry(options) {
    const e = options;
    return await helpers_1.client.issueSearch.searchForIssuesUsingJqlGet({
        jql: 'assignee=currentUser()', fields: ['*all']
    });
    // return await client.issues.getIssue({ issueIdOrKey: e.issue });
}
function displayIssues(issues, options) {
    const table = new cli_table_1.default({
        head: ['Key', 'Priority', 'Summary', 'Status', 'FixVersions'],
        // colWidths: [13, 10, getMainTextColWidth(160),20,10],
        chars: {
            'top': '',
            'top-mid': '',
            'top-left': '',
            'top-right': '',
            'bottom': '',
            'bottom-mid': '',
            'bottom-left': '',
            'bottom-right': '',
            'left': '',
            'left-mid': '',
            'mid': '',
            'mid-mid': '',
            'right': '',
            'right-mid': ''
        },
        style: {
            'padding-left': 1,
            'padding-right': 1,
            head: ['cyan'],
            compact: false
        }
    });
    const newIssueList = [];
    // get all unique parents
    const parents = [...new Set(issues.map(x => x.fields.parent?.key))];
    // reorder so list is parent | children... parent | children ... orphans...
    parents.forEach((x) => {
        if (!x)
            return;
        newIssueList.push(issues.find(y => y.key === x));
        const s = issues.filter(v => v.fields.parent?.key === x).sort().reverse();
        newIssueList.push(...s);
        issues = issues.filter(v => (v.fields?.parent?.key !== x && v.key !== x));
    });
    newIssueList.push(...issues);
    issues = newIssueList.filter(x => x.fields.status.name !== 'Done');
    for (let i = 0; i < issues.length; i += 1) {
        let priority = issues[i].fields?.priority;
        const summary = issues[i].fields.summary;
        const status = issues[i].fields.status;
        if (!priority) {
            priority = {
                name: ''
            };
        }
        // if (summary.length > 50) {
        //   summary = summary.substr(0, 47) + '...';
        // }
        const fv = issues[i].fields.fixVersions?.map(elem => elem.name).join(',');
        if (issues[i].fields?.issuetype?.name === 'Epic')
            // special EPIC coloring for EPICS
            table.push([chalk_1.default.redBright(issues[i]?.key), priority.name, summary, status.name, fv ?? 'n/a']);
        else if (issues[i].fields?.parent)
            // indent children to indicate relationship
            table.push(['|-' + issues[i].key, priority.name, summary, status.name, fv ?? 'n/a']);
        else
            //orphans
            table.push([issues[i].key, priority.name, summary, status.name, fv ?? 'n/a']);
    }
    if (issues.length > 0) {
        //dont print if no_print is set
        if (!(options && options.no_print)) {
            console.log(table.toString());
        }
    }
    else {
        console.log('No issues');
    }
}
function callIssueApi(options, cb) {
    const allIssues = [];
    let currentLength = 0;
    let currentOffset = 0;
    const currentLimit = 500;
    async_1.default.doWhilst((callback) => {
        currentLength = 0;
        const rq = `${config_1.default.auth.url}${this.query}&startAt=${currentOffset}&maxResults=${currentLimit}`;
        if (options && options.verbose) {
            console.log(rq);
        }
        ssl_request_1.default.get(rq).then(res => {
            if (!res.ok) {
                return callback((res.body.errorMessages || [res.error]).join('\n'));
            }
            allIssues.push(...allIssues, ...res.body.issues);
            currentLength = res.body.issues.length;
            currentOffset += currentLength;
            return callback(null, allIssues);
        }).catch(rej => {
            return callback((rej.body.errorMessages || [rej.error]).join('\n'));
        });
        // return callback(null, allIssues);
    }, (_, checkCallback) => {
        if (currentLength === 0) {
            return checkCallback(null, false);
        }
        return checkCallback(null, true);
    }, (er) => {
        cb(er, allIssues);
    });
}
function getIssues(options, cb) {
    if (!cb) {
        cb = options;
        options = null;
    }
    this.callIssueApi(options, (err, issues = undefined) => {
        if (err) {
            return cb(err);
        }
        if (options && options.json) {
            return cb(null, issues);
        }
        this.issues = issues;
        this.table = new cli_table_1.default({
            head: ['Key', 'Priority', 'Summary', 'Status', 'FixVersions'],
            colWidths: [20, 10, helpers_1.getMainTextColWidth(160), 100, 30],
            chars: {
                'top': '',
                'top-mid': '',
                'top-left': '',
                'top-right': '',
                'bottom': '',
                'bottom-mid': '',
                'bottom-left': '',
                'bottom-right': '',
                'left': '',
                'left-mid': '',
                'mid': '',
                'mid-mid': '',
                'right': '',
                'right-mid': ''
            },
            style: {
                'padding-left': 1,
                'padding-right': 1,
                head: ['cyan'],
                compact: true
            }
        });
        for (let i = 0; i < this.issues.length; i += 1) {
            let priority = this.issues[i].fields.priority, summary = this.issues[i].fields.summary;
            const status = this.issues[i].fields.status;
            if (!priority) {
                priority = {
                    name: ''
                };
            }
            if (summary.length > 50) {
                summary = summary.substr(0, 47) + '...';
            }
            if (this.issues[i].fields.fixVersions.length) {
                const fv = this.issues[i].fields.fixVersions.map(elem => elem.name).join(',');
                this.table.push([chalk_1.default.redBright(this.issues[i].key), priority.name, summary, status.name, fv]);
            }
            else {
                this.table.push([chalk_1.default.redBright(this.issues[i].key), priority.name, summary, status.name, 'n/a']);
            }
        }
        if (this.issues.length > 0) {
            //dont print if no_print is set
            if (!(options && options.no_print)) {
                console.log(this.table.toString());
            }
        }
        else {
            console.log('No issues');
        }
        return cb(null, this.issues);
    });
}
function showAll(options, cb) {
    this.type = options && options?.type ? '+AND+type="' + options?.type + '"' : '';
    this.query = 'rest/api/2/search?jql=' + 'assignee=currentUser()' + this.type + '+AND+status+in+("' + this.getAvailableStatuses() + '")' + '+order+by+key+DESC' + '&maxResults=500';
    return this.getIssues(options, cb);
}
function showInProgress(cb) {
    this.query = 'rest/api/2/search?jql=' + 'assignee=currentUser()' + '+AND+status+in+("In+Progress")' + '+order+by+priority+DESC,+key+ASC';
    return this.getIssues(cb);
}
function showByProject(options, cb) {
    this.type = options && options.type ? '+AND+type=' + options.type : '';
    const project = options && options.project ? '+AND+project=' + options.project : '';
    this.query = 'rest/api/2/search?jql=' + 'assignee=currentUser()' + this.type + project + '+AND+status+in+("' + this.getAvailableStatuses() + '")' + '+order+by+priority+DESC,+key+ASC';
    return getIssues(cb);
}
function search(query, cb) {
    this.query = 'rest/api/2/search?jql=' + 'summary+~+"' + query + '"' + '+OR+details+~+"' + query + '"' + '+OR+comment+~+"' + query + '"' + '+order+by+priority+DESC,+key+ASC';
    return getIssues(cb);
}
function jqlSearch(jql, options, cb) {
    let query;
    if (options && options.custom) {
        if (config_1.default.custom_jql && config_1.default.custom_jql[options.custom]) {
            query = config_1.default.custom_jql[options.custom];
        }
        else {
            query = options.custom;
        }
    }
    else {
        if (config_1.default.custom_jql && config_1.default.custom_jql[jql]) {
            query = config_1.default.custom_jql[jql];
        }
        else {
            query = jql;
        }
    }
    this.query = 'rest/api/2/search?jql=' + encodeURIComponent(query);
    return getIssues(options, cb);
}
function getAvailableStatuses() {
    return config_1.default.options.available_issues_statuses.join('", "');
}
function aggregateResults(jql, options, cb) {
    if (!options) {
        options = {};
    }
    options.json = true;
    jqlSearch(jql, options, function (err, issues) {
        if (err) {
            return cb(err);
        }
        let query;
        if (options && options.custom_sql) {
            if (config_1.default.custom_alasql && config_1.default.custom_alasql[options.custom_sql]) {
                query = config_1.default.custom_alasql[options.custom_sql];
            }
            else {
                query = options.custom_sql;
            }
        }
        else {
            return cb(new Error('no custom sql found'));
        }
        let result = [];
        try {
            console.log(query);
            result = alasql_1.default(query, [issues]);
        }
        catch (ex) {
            return cb(ex);
        }
        if (!result.length) {
            return cb(new Error('No Result'));
        }
        const resultTable = new cli_table_1.default({
            head: Object.keys(result[0])
        });
        let eachRow = [];
        for (let i = 0; i < result.length; i += 1) {
            eachRow = [];
            Object.keys(result[0]).forEach(function (eachKey) {
                eachRow.push(result[i][eachKey] || '');
            });
            resultTable.push(eachRow);
        }
        console.log(resultTable.toString());
        return cb(null, result);
    });
}
exports.default = (function () {
    const ls = {
        project: null,
        query: null,
        type: null,
        issues: null,
        table: null,
        callIssueApi(options, cb) {
            const allIssues = [];
            let currentLength = 0;
            let currentOffset = 0;
            const currentLimit = 500;
            async_1.default.doWhilst((callback) => {
                currentLength = 0;
                const rq = `${config_1.default.auth.url}${this.query}&startAt=${currentOffset}&maxResults=${currentLimit}`;
                if (options && options.verbose) {
                    console.log(rq);
                }
                ssl_request_1.default.get(rq).then(res => {
                    if (!res.ok) {
                        return callback((res.body.errorMessages || [res.error]).join('\n'));
                    }
                    allIssues.push(...allIssues, ...res.body.issues);
                    currentLength = res.body.issues.length;
                    currentOffset += currentLength;
                    return callback(null, allIssues);
                }).catch(rej => {
                    return callback((rej.body.errorMessages || [rej.error]).join('\n'));
                });
                // return callback(null, allIssues);
            }, (_, checkCallback) => {
                if (currentLength === 0) {
                    return checkCallback(null, false);
                }
                return checkCallback(null, true);
            }, (er) => {
                cb(er, allIssues);
            });
        },
        getIssues: function (options, cb) {
            if (!cb) {
                cb = options;
                options = null;
            }
            this.callIssueApi(options, (err, issues = undefined) => {
                if (err) {
                    return cb(err);
                }
                if (options && options.json) {
                    return cb(null, issues);
                }
                this.issues = issues;
                this.table = new cli_table_1.default({
                    head: ['Key', 'Priority', 'Summary', 'Status', 'FixVersions'],
                    chars: {
                        'top': '',
                        'top-mid': '',
                        'top-left': '',
                        'top-right': '',
                        'bottom': '',
                        'bottom-mid': '',
                        'bottom-left': '',
                        'bottom-right': '',
                        'left': '',
                        'left-mid': '',
                        'mid': '',
                        'mid-mid': '',
                        'right': '',
                        'right-mid': ''
                    },
                    style: {
                        'padding-left': 1,
                        'padding-right': 1,
                        head: ['cyan'],
                        compact: true
                    }
                });
                for (let i = 0; i < this.issues.length; i += 1) {
                    let priority = this.issues[i].fields.priority, summary = this.issues[i].fields.summary;
                    const status = this.issues[i].fields.status;
                    if (!priority) {
                        priority = {
                            name: ''
                        };
                    }
                    if (summary.length > 50) {
                        summary = summary.substr(0, 47) + '...';
                    }
                    if (this.issues[i].fields.fixVersions.length) {
                        const fv = this.issues[i].fields.fixVersions.map(elem => elem.name).join(',');
                        this.table.push([chalk_1.default.redBright(this.issues[i].key), priority.name, summary, status.name, fv]);
                    }
                    else {
                        this.table.push([chalk_1.default.redBright(this.issues[i].key), priority.name, summary, status.name, 'n/a']);
                    }
                }
                if (this.issues.length > 0) {
                    //dont print if no_print is set
                    if (!(options && options.no_print)) {
                        console.log(this.table.toString());
                    }
                }
                else {
                    console.log('No issues');
                }
                return cb(null, this.issues);
            });
        },
        showAll(options, cb) {
            this.type = options && options.type ? '+AND+type="' + options.type + '"' : '';
            this.query = 'rest/api/2/search?jql=' + 'assignee=currentUser()' + this.type + '+AND+status+in+("' + this.getAvailableStatuses() + '")' + '+order+by+key+DESC' + '&maxResults=500';
            return this.getIssues(options, cb);
        },
        showInProgress: function (cb) {
            this.query = 'rest/api/2/search?jql=' + 'assignee=currentUser()' + '+AND+status+in+("In+Progress")' + '+order+by+priority+DESC,+key+ASC';
            return this.getIssues(cb);
        },
        showByProject: function (options, cb) {
            this.type = options && options.type ? '+AND+type=' + options.type : '';
            const project = options && options.project ? '+AND+project=' + options.project : '';
            this.query = 'rest/api/2/search?jql=' + 'assignee=currentUser()' + this.type + project + '+AND+status+in+("' + this.getAvailableStatuses() + '")' + '+order+by+priority+DESC,+key+ASC';
            return this.getIssues(cb);
        },
        search: function (query, cb) {
            this.query = 'rest/api/2/search?jql=' + 'summary+~+"' + query + '"' + '+OR+details+~+"' + query + '"' + '+OR+comment+~+"' + query + '"' + '+order+by+priority+DESC,+key+ASC';
            return this.getIssues(cb);
        },
        jqlSearch: function (jql, options, cb) {
            let query;
            if (options && options.custom) {
                if (config_1.default.custom_jql && config_1.default.custom_jql[options.custom]) {
                    query = config_1.default.custom_jql[options.custom];
                }
                else {
                    query = options.custom;
                }
            }
            else {
                if (config_1.default.custom_jql && config_1.default.custom_jql[jql]) {
                    query = config_1.default.custom_jql[jql];
                }
                else {
                    query = jql;
                }
            }
            this.query = 'rest/api/2/search?jql=' + encodeURIComponent(query);
            return this.getIssues(options, cb);
        },
        getAvailableStatuses: function () {
            return config_1.default.options.available_issues_statuses.join('", "');
        },
        aggregateResults: function (jql, options, cb) {
            if (!options) {
                options = {};
            }
            options.json = true;
            this.jqlSearch(jql, options, function (err, issues) {
                if (err) {
                    return cb(err);
                }
                let query;
                if (options && options.custom_sql) {
                    if (config_1.default.custom_alasql && config_1.default.custom_alasql[options.custom_sql]) {
                        query = config_1.default.custom_alasql[options.custom_sql];
                    }
                    else {
                        query = options.custom_sql;
                    }
                }
                else {
                    return cb(new Error('no custom sql found'));
                }
                let result = [];
                try {
                    console.log(query);
                    result = alasql_1.default(query, [issues]);
                }
                catch (ex) {
                    return cb(ex);
                }
                if (!result.length) {
                    return cb(new Error('No Result'));
                }
                const resultTable = new cli_table_1.default({
                    head: Object.keys(result[0])
                });
                let eachRow = [];
                for (let i = 0; i < result.length; i += 1) {
                    eachRow = [];
                    Object.keys(result[0]).forEach(function (eachKey) {
                        eachRow.push(result[i][eachKey] || '');
                    });
                    resultTable.push(eachRow);
                }
                console.log(resultTable.toString());
                return cb(null, result);
            });
        }
    };
    return ls;
})();
