"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ssl_request_1 = __importDefault(require("../ssl_request"));
const cli_table_1 = __importDefault(require("cli-table"));
const openurl_1 = __importDefault(require("openurl"));
const url_1 = __importDefault(require("url"));
const config_1 = __importDefault(require("../config"));
exports.default = (() => {
    const describe = {
        query: null,
        priority: null,
        table: null,
        getIssueField: function (field) {
            ssl_request_1.default.get(config_1.default.auth.url + this.query + '?fields=' + field).end((err, res) => {
                if (!res.ok) {
                    return console.log(res);
                }
                if (res.body.fields) {
                    if (typeof res.body.fields[field] === 'string') {
                        console.log(res.body.fields[field]);
                    }
                    else {
                        console.log(res.body.fields[field].name);
                    }
                }
                else {
                    console.log('Field does not exist.');
                }
            });
        },
        getIssue: function () {
            ssl_request_1.default.get(config_1.default.auth.url + this.query).end((err, res) => {
                if (!res.ok) {
                    //return console.log(res.body.errorMessages.join('\n'));
                    return console.log(res);
                }
                this.table = new cli_table_1.default();
                this.priority = res.body.fields.priority;
                this.description = res.body.fields.description;
                if (!this.priority) {
                    this.priority = {
                        name: ''
                    };
                }
                if (!this.description) {
                    this.description = 'No details';
                }
                this.table.push({
                    'Issue': res.body.key
                }, {
                    'Summary': res.body.fields.summary
                }, {
                    'Type': res.body.fields.issuetype.name
                }, {
                    'Priority': this.priority.name
                }, {
                    'Status': res.body.fields.status.name
                }, {
                    'Reporter': res.body.fields.reporter.displayName + ' <' + res.body.fields.reporter.emailAddress + '> '
                }, {
                    'Assignee': (res.body.fields.assignee ? res.body.fields.assignee.displayName : 'Not Assigned') + ' <' + (res.body.fields.assignee ? res.body.fields.assignee.emailAddress : '') + '> '
                }, {
                    'Labels': res.body.fields.labels ? res.body.fields.labels.join(', ') : ''
                }, {
                    'Subtasks': res.body.fields.subtasks.length
                }, {
                    'Comments': res.body.fields.comment.total
                });
                console.log(this.table.toString());
                console.log('\r\n' + this.description + '\r\n');
            });
        },
        open: function (issue) {
            openurl_1.default.open(url_1.default.resolve(config_1.default.auth.url, 'browse/' + issue));
        },
        show: function (issue, field = undefined) {
            this.query = 'rest/api/latest/issue/' + issue;
            if (field) {
                return this.getIssueField(field);
            }
            else {
                return this.getIssue();
            }
        }
    };
    return describe;
})();
