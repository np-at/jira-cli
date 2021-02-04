"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/* eslint-disable max-depth */
/*global*/
const utils_1 = __importDefault(require("../utils"));
const inquirer_1 = __importDefault(require("inquirer"));
const prompt = inquirer_1.default.createPromptModule();
const Create = (jira) => {
    function printError(messages) {
        console.log(messages.join('\n'));
    }
    const create = {
        query: null,
        table: null,
        isSubTask: false,
        properties: [],
        projects: [],
        priorities: [],
        answers: {
            fields: {}
        },
        ask(question, callback, yesno, values, answer) {
            const options = {}, issueTypes = [];
            if (answer || answer === false) {
                return callback(answer);
            }
            if (values && values.length > 0) {
                for (let i = 0; i < values.length; i++) {
                    if (this.isSubTask) {
                        if (values[i].subtask !== undefined) {
                            if (values[i].subtask) {
                                issueTypes.push("(" + values[i].id + ") " + values[i].name);
                            }
                        }
                        else {
                            issueTypes.push("(" + values[i].id + ") " + values[i].name);
                        }
                    }
                    else {
                        if (!values[i].subtask) {
                            issueTypes.push("(" + values[i].id + ") " + values[i].name);
                        }
                    }
                }
                console.log(issueTypes.join("\n"));
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
        },
        askProject: function (project, callback) {
            this.ask('Type the project name or key: ', function (answer) {
                let projectId = 0, index = 0;
                answer = answer.charAt(0).toUpperCase() + answer.substring(1).toLowerCase();
                for (let i; i < this.projects.length; i++) {
                    if (answer === this.projects[i].key || answer.toUpperCase() === this.projects[i].key) {
                        projectId = this.projects[i].id;
                        index = i;
                    }
                    else if (answer === this.projects[i].name) {
                        projectId = this.projects[i].id;
                        index = i;
                    }
                }
                if (projectId > 0) {
                    callback(projectId, index);
                }
                else {
                    console.log('Project "' + answer + '" does not exists.');
                    this.askProject(project, callback);
                }
            }, null, null, project);
        },
        askSubTask: function (subtask, callback) {
            this.ask('Type the parent task key (only the numbers) if exists, otherwise press enter: ', function (answer) {
                if (answer === false || parseInt(answer) > 0) {
                    this.isSubTask = answer ? true : false;
                    callback(answer);
                }
                else {
                    console.log('Please, type only the task number (ex: if issue is "XXX-324", type only "324").');
                    this.askSubTask(subtask, callback);
                }
            }, true, null, subtask);
        },
        askIssueType: function (type, callback) {
            const issueTypeArray = this.project.issuetypes;
            this.ask('Select issue type: ', function (issueType) {
                callback(issueType);
            }, false, issueTypeArray, type);
        },
        askIssuePriorities: function (priority, callback) {
            const issuePriorities = this.priorities;
            this.ask('Select the priority: ', function (issuePriority) {
                callback(issuePriority);
            }, false, issuePriorities, priority);
        },
        newIssue: function (projIssue, options) {
            let project = typeof projIssue === 'string' ? projIssue : undefined;
            let parent = undefined;
            if (project !== undefined) {
                const split = project.split('-');
                project = split[0];
                if (split.length > 1) {
                    parent = split[1];
                    console.log('Creating subtask for issue ' + projIssue);
                }
                else {
                    console.log('Creating issue in project ' + project);
                }
            }
            this.getMeta(function (error, meta) {
                if (error) {
                    printError(error.messages);
                    process.stdin.destroy();
                    return;
                }
                create.projects = meta;
                this.askProject(options.project, function (projectId, index) {
                    this.project = this.projects[index];
                    this.answers.fields.project = {
                        id: projectId
                    };
                    if (!options.subtask && (options.priority || options.type || options.summary || options.description)) {
                        options.subtask = false;
                    }
                    this.askSubTask(options.subtask, function (taskKey) {
                        if (taskKey) {
                            this.answers.fields.parent = {
                                key: this.project.key + '-' + taskKey
                            };
                        }
                        this.askIssueType(options.type, function (issueTypeId) {
                            this.answers.fields.issuetype = {
                                id: issueTypeId
                            };
                            this.ask('Type the issue summary: ', function (issueSummary) {
                                this.answers.fields.summary = issueSummary;
                                this.ask('Type the issue description: ', function (issueDescription) {
                                    const defaultAnswer = issueSummary;
                                    if (!issueDescription) {
                                        this.answer.fields.description = defaultAnswer;
                                    }
                                    else {
                                        this.answers.fields.description = issueDescription;
                                    }
                                    process.stdin.destroy();
                                    this.saveIssue(options);
                                }, null, null, options.description);
                            }, null, null, options.summary);
                        });
                    });
                });
            });
        },
        getMeta: function (callback) {
            jira.issue.getCreateMetadata({})
                .then(data => {
                callback(undefined, data.projects);
            }, response => {
                callback({ messages: utils_1.default.extractErrorMessages(response) }, undefined);
            });
        },
        saveIssue: function () {
            jira.issue.createIssue(this.answers)
                .then(data => {
                console.log(`Issue ${data.key} created successfully!`);
            }, response => {
                const errorMessages = utils_1.default.extractErrorMessages(response);
                printError(errorMessages);
            });
        }
    };
    return create;
};
exports.default = Create;
