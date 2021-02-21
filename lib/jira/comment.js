"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.jiraComment = void 0;
const ssl_request_1 = __importDefault(require("../ssl_request"));
const config_1 = __importDefault(require("../config"));
const helpers_1 = require("../helpers/helpers");
const jiraComment = async (issue, comment) => {
    try {
        await helpers_1.client.issueComments.addComment({ issueIdOrKey: issue, body: comment });
    }
    catch (e) {
        console.error(e);
    }
};
exports.jiraComment = jiraComment;
exports.default = comment;
function comment() {
    const comment = {
        query: null,
        table: null,
        to: function (issue, comment) {
            this.query = 'rest/api/latest/issue/' + issue + '/comment';
            ssl_request_1.default.post(config_1.default.auth.url + this.query).send({
                body: comment
            }).end((err, res) => {
                if (!res.ok) {
                    return console.log((res.body.errorMessages || [res.error]).join('\n'));
                }
                return console.log('Comment to issue [' + issue + '] was posted!.');
            });
        },
        show(issue) {
            let i = 0;
            this.query = 'rest/api/latest/issue/' + issue + '/comment';
            ssl_request_1.default
                .get(config_1.default.auth.url + this.query)
                .end((err, res) => {
                if (!res.ok) {
                    return console.log(res.body.errorMessages.join('\n'));
                }
                if (res.body.total > 0) {
                    for (i = 0; i < res.body.total; i += 1) {
                        let updated = new Date(res.body.comments[i].updated);
                        updated = ' (' + updated + ')';
                        console.log('\n' + res.body.comments[i].author.displayName.cyan + updated);
                        console.log(res.body.comments[i].body);
                    }
                }
                else {
                    return console.log('There are no comments on this issue.');
                }
            });
        }
    };
    return comment;
}
