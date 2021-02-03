"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/*global requirejs,console,define,fs*/
const ssl_request_1 = __importDefault(require("../ssl_request"));
const cli_table_1 = __importDefault(require("cli-table"));
const moment_1 = __importDefault(require("moment"));
const config_1 = __importDefault(require("../config"));
exports.default = (() => {
    const worklog = {
        add: function (issue, timeSpent, comment, startedAt) {
            const url = 'rest/api/latest/issue/' + issue + '/worklog';
            const formattedStart = moment_1.default(startedAt).format('YYYY-MM-DD[T]HH:mm:ss.SSSZZ');
            ssl_request_1.default.post(config_1.default.auth.url + url).send({
                comment: comment,
                timeSpent: timeSpent,
                started: formattedStart
            }).end((err, res) => {
                if (!res.ok) {
                    return console.log((res.body.errorMessages || [res.error]).join('\n'));
                }
                return console.log('Worklog to issue [' + issue + '] was added!.');
            });
        },
        show: function (issue) {
            const url = 'rest/api/latest/issue/' + issue + '/worklog';
            ssl_request_1.default.get(config_1.default.auth.url + url).end((err, res) => {
                if (!res.ok) {
                    return console.log(res.body.errorMessages.join('\n'));
                }
                if (res.body.total === 0) {
                    console.log('No work yet logged');
                    return;
                }
                const tbl = new cli_table_1.default({
                    head: ['Date', 'Author', 'Time Spent', 'Comment']
                }), worklogs = res.body.worklogs;
                for (let i = 0; i < worklogs.length; i++) {
                    const startDate = worklogs[i].created, author = worklogs[i].author.displayName, timeSpent = worklogs[i].timeSpent;
                    let comment = worklogs[i].comment || '';
                    if (comment.length > 50) {
                        comment = comment.substr(0, 47) + '...';
                    }
                    tbl.push([startDate,
                        author, timeSpent, comment]);
                }
                console.log(tbl.toString());
            });
        }
    };
    return worklog;
})();
