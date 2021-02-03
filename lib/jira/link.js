"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/* eslint-disable max-depth */
const ssl_request_1 = __importDefault(require("../ssl_request"));
const config_1 = __importDefault(require("../config"));
const inquirer_1 = __importDefault(require("inquirer"));
const prompt = inquirer_1.default.createPromptModule();
exports.default = (() => {
    function ask(question, callback, yesno, values, options) {
        options = options || {};
        const issueTypes = [];
        let i = 0; //from command if provided
        if (options.link_value) {
            return callback(options.link_value);
        }
        if (values && values.length > 0) {
            for (i; i < values.length; i++) {
                if (this.isSubTask) {
                    if (values[i].subtask !== undefined) {
                        if (values[i].subtask) {
                            issueTypes.push('(' + values[i].id + ') ' + options.from + ' ' + values[i].outward + ' ' + options.to);
                        }
                    }
                    else {
                        issueTypes.push('(' + values[i].id + ') ' + options.from + ' ' + values[i].outward + ' ' + options.to);
                    }
                }
                else {
                    if (!values[i].subtask) {
                        issueTypes.push('(' + values[i].id + ') ' + options.from + ' ' + values[i].outward + ' ' + options.to);
                    }
                }
            }
            console.log(issueTypes.join('\n'));
        }
        prompt({ message: question }).then(function (answer) {
            if (answer.length > 0) {
                callback(answer);
            }
            else {
                if (yesno) {
                    callback(false);
                }
                else {
                    this.ask(question, callback);
                }
            }
        }, options);
    }
    function askLinkType(options, cb) {
        getLinkType(function (linkTypes) {
            ask('Select the linktype: ', function (link) {
                cb(link);
            }, false, linkTypes, options);
        });
    }
    function getLinkType(cb) {
        this.query = 'rest/api/2/issueLinkType';
        ssl_request_1.default.get(config_1.default.auth.url + this.query).end((err, res) => {
            if (!res.ok) {
                return console.log(res.body.errorMessages.join('\n'));
            }
            return console.log(res.body.issueLinkTypes);
        });
    }
    function callLink(reqOpts, cb) {
        this.query = 'rest/api/2/issueLink';
        ssl_request_1.default.post(config_1.default.auth.url + this.query).send(reqOpts).end((err, res) => {
            if (!res.ok) {
                return console.log(res.body.errorMessages.join('\n'));
            }
            console.log('Issues linked');
            return cb();
        });
    }
    return function link(from, to, link_value, options, cb) {
        const reqOpts = {
            'type': {
                'name': 'Relate',
                id: undefined
            },
            'inwardIssue': {
                'key': from
            },
            'outwardIssue': {
                'key': to
            },
            'comment': {
                'body': 'Linked related issue!'
            }
        };
        options.from = from;
        options.to = to;
        options.link_value = link_value;
        askLinkType(options, function (linkname) {
            reqOpts.type.id = linkname;
            callLink(reqOpts, cb);
        });
    };
})();
