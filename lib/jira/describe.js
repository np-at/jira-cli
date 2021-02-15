"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.addDescribeCommand = void 0;
const ssl_request_1 = __importDefault(require("../ssl_request"));
const cli_table_1 = __importDefault(require("cli-table"));
const openurl_1 = __importDefault(require("openurl"));
const url_1 = __importDefault(require("url"));
const config_1 = __importDefault(require("../config"));
const helpers_1 = require("../helpers/helpers");
const os = __importStar(require("os"));
const CompletionHelpers_1 = require("../helpers/CompletionHelpers");
const addDescribeCommand = (prog) => {
    prog
        .command('show <issue>')
        .description('Show info about an issue')
        .option('-o, --output <field>', 'Output field content', String)
        .action(async (issue, options) => {
        try {
            const curIssue = await helpers_1.client.issues.getIssue({ issueIdOrKey: issue, fields: ['*all'] });
            displayIssueDetails(curIssue);
        }
        catch (e) {
            console.error(e);
        }
    }).command('_complete', { hidden: true })
        .action(CompletionHelpers_1.issuePickerCompletionAsync);
};
exports.addDescribeCommand = addDescribeCommand;
const displayIssueDetails = (iss) => {
    const table = new cli_table_1.default();
    const comments = iss.fields.comment.comments.map(x => {
        return String(x.body.toString() + '--' + x.author.displayName);
    }).join(os.EOL);
    table.push({
        'Issue': iss.key
    }, {
        'Summary': iss.fields.summary
    }, {
        'Type': iss.fields.issuetype.name
    }, {
        'Priority': iss.fields.priority.name
    }, {
        'Status': iss.fields.status.name
    }, {
        'Reporter': iss.fields.reporter.displayName + ' <' + iss.fields.reporter.emailAddress + '> '
    }, {
        'Assignee': (iss.fields.assignee ? iss.fields.assignee.displayName : 'Not Assigned') + ' <' + (iss.fields.assignee ? iss.fields.assignee.emailAddress : '') + '> '
    }, {
        'Labels': iss.fields.labels ? iss.fields.labels.join(', ') : ''
    }, {
        'Subtasks': iss.fields.subtasks.length
    });
    console.log(table.toString());
    console.log(iss.fields.description ?? 'No Description');
    const width = process.stdout.getWindowSize();
    const a = new Array(width[0] - 20).fill('-', 0).join('');
    console.log(a);
    console.log(iss.fields.comment.comments.map(x => {
        return String('---------------------' + os.EOL + x.updated.toString() + os.EOL + x.body.toString() + os.EOL + '  ' + x.author.displayName);
    }).join(os.EOL));
};
exports.default = (() => {
    const describe = {
        query: null,
        priority: null,
        table: null,
        getIssueField: function (field) {
            ssl_request_1.default.get(config_1.default.auth.url + this.query + '?fields=' + field ?? '*all').end((err, res) => {
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
