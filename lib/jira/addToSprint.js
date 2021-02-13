"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ssl_request_1 = __importDefault(require("../ssl_request"));
const config_1 = __importDefault(require("../config"));
const sprint_1 = __importDefault(require("./sprint"));
const ls_1 = __importDefault(require("./ls"));
const async_1 = __importDefault(require("async"));
const inquirer_1 = __importDefault(require("inquirer"));
const prompt = inquirer_1.default.createPromptModule();
function addToSprint() {
    function ask(question, callback, yesno, values, options) {
        options = options || {};
        const issueTypes = [];
        let i = 0;
        if (values && values.length > 0) {
            for (i; i < values.length; i++) {
                issueTypes.push('(' + values[i][0] + ') ' + values[i][1]);
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
        });
    }
    const addToSprint = {
        addIssuesViaKey: function addIssuesViaKey(options, cb) {
            if (options.rapidboard || options.sprint) {
                sprint_1.default(options.rapidboard, options.sprint, function (sprintData) {
                    ask('Please enter the sprint', function (sprintId) {
                        console.log('here');
                        _addToSprint(sprintId, options.add, cb);
                    }, false, sprintData);
                });
            }
            else if (options.jql) {
                addAllJqlToSprint(options.sprintId, options.jql, cb);
            }
            else if (options.sprintId) {
                _addToSprint(options.sprintId, options.add, cb);
            }
        },
        addAllJqlToSprint: function addAllJqlToSprint(options, cb) {
            if (!options.jql || !options.sprintId) {
                return cb(new Error('jql or sprint id not found'));
            }
            ls_1.default.jqlSearch(options.jql, {}, function (err, issues) {
                ask('Are you sure you want to add all above issues in sprint id ' + options.sprintId + ' [y/N]: ', function (answer) {
                    if (answer !== 'y') {
                        return cb('no issues were added to sprint');
                    }
                    async_1.default.eachSeries(issues, (eachIssue, scb) => {
                        _addToSprint(options.sprintId, eachIssue.key, scb);
                    }, () => cb());
                }, true);
            });
        }
    };
    function addAllJqlToSprint(sprintId, jql, cb) {
        ls_1.default.jqlSearch(jql, {}, function (err, issues) {
            ask('Are you sure you want to add all above issues in sprint id ' + sprintId + ':', function (answer) {
                console.log(answer);
            }, true);
        });
    }
    function _addToSprint(sprintId, projIsssue, cb) {
        const data = {
            'fields': {}
        };
        if (!config_1.default.edit_meta || !config_1.default.edit_meta.sprint) {
            return cb('sprint field not found');
        }
        data.fields[config_1.default.edit_meta.sprint.name] = config_1.default.edit_meta.sprint.type === 'number' ? Number(sprintId) : sprintId;
        ssl_request_1.default.put(config_1.default.auth.url + '/rest/api/2/issue/' + projIsssue).send(data).end((err, res) => {
            if (!res.ok) {
                console.log('Error getting rapid boards. HTTP Status Code: ' + res.status);
                console.dir(res.body);
                return cb();
            }
            console.log('Added [' + projIsssue + '] to sprint with id ' + sprintId);
            return cb();
        });
    }
    return addToSprint;
}
exports.default = addToSprint;
