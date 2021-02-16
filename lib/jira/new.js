"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ssl_request_1 = __importDefault(require("../ssl_request"));
const config_1 = __importDefault(require("../config"));
const async_1 = __importDefault(require("async"));
const utils_1 = __importDefault(require("../utilities/utils"));
const inquirer_1 = __importDefault(require("inquirer"));
const prompt = inquirer_1.default.createPromptModule();
function newFxn() {
    const create = {
        query: null,
        table: null,
        isSubTask: false,
        projects: [],
        projectMeta: {
            issuetypes: []
        },
        priorities: [],
        answers: {
            fields: {}
        },
        issueType: null,
        ask(question, callback, yesno, values, answer) {
            const options = {}, issueTypes = [];
            if (answer || answer === false) {
                return callback(answer);
            }
            if (values && values.length > 0) {
                for (let i; i < values.length; i++) {
                    if (this.isSubTask) {
                        if (values[i].subtask !== undefined) {
                            if (values[i].subtask) {
                                issueTypes.push('(' + values[i].id + ') ' + (values[i].name ? values[i].name : values[i].value));
                            }
                        }
                        else {
                            issueTypes.push('(' + values[i].id + ') ' + (values[i].name ? values[i].name : values[i].value));
                        }
                    }
                    else if (!values[i].subtask) {
                        issueTypes.push('(' + values[i].id + ') ' + (values[i].name ? values[i].name : values[i].value));
                    }
                }
                console.log(issueTypes.join('\n'));
            }
            prompt({ message: question }).then((answer) => {
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
        askProject(project, callback) {
            this.ask('Type the project name or key: ', (answer) => {
                let projectId = 0, index = 0;
                answer = answer.charAt(0).toUpperCase() + answer.substring(1).toLowerCase();
                for (let i = 0; i < this.projects.length; i++) {
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
                    callback(projectId, index, answer.toUpperCase());
                }
                else {
                    console.log('Project "' + answer + '" does not exists.');
                    this.askProject(project, callback);
                }
            }, false, null, project);
        },
        getMeta(key, callback) {
            this.query = 'rest/api/2/issue/createmeta';
            if (key) {
                this.query += '?projectKeys=' + key + '&expand=projects.issuetypes.fields';
            }
            ssl_request_1.default.get(config_1.default.auth.url + this.query).end((err, res) => {
                if (!res.ok) {
                    const errorMessages = utils_1.default.extractErrorMessages(res).join('\n');
                    console.log(errorMessages);
                    return callback(errorMessages);
                }
                callback(null, res.body.projects);
            });
        },
        askIssueType(type, callback) {
            const issueTypeArray = create.projectMeta.issuetypes;
            this.ask('Select issue type: ', (issueType) => {
                callback(issueType);
            }, false, issueTypeArray, type);
        },
        askRequired(eachField, eachFieldKey, defaultAnswer, scb) {
            if (!eachField.required && !(config_1.default.default_create && config_1.default.default_create['__always_ask'] && config_1.default.default_create['__always_ask'].fields && config_1.default.default_create['__always_ask'].fields[eachFieldKey])) {
                return scb();
            }
            const question = (eachField.allowedValues ? 'Select ' : 'Enter ') + eachField.name + ' : ';
            this.ask(question, answer => {
                if (answer) {
                    if (eachField.schema.type === 'array') {
                        if (eachField.schema.items !== 'string') {
                            create.answers.fields[eachFieldKey] = [{
                                    id: answer
                                }];
                        }
                        else {
                            answer = answer.split(',');
                            create.answers.fields[eachFieldKey] = answer;
                        }
                    }
                    else if (eachField.schema.type === 'string') {
                        create.answers.fields[eachFieldKey] = answer;
                    }
                    else {
                        create.answers.fields[eachFieldKey] = {
                            id: answer
                        };
                    }
                    return scb();
                }
                else {
                    return create.askRequired(eachField, eachFieldKey, defaultAnswer, scb);
                }
            }, false, eachField.allowedValues, defaultAnswer);
        },
        saveIssue(options, cb) {
            this.query = 'rest/api/2/issue';
            const post_url = config_1.default.auth.url + this.query;
            if (!create.answers.fields.reporter['name'] &&
                create.answers.fields.reporter['id']) {
                create.answers.fields.reporter['name'] = create.answers.fields.reporter['id'];
            }
            const body = JSON.stringify(create.answers);
            if (options.verbose) {
                console.log(create.answers);
                console.log(post_url);
                console.log(body);
            }
            ssl_request_1.default.post(post_url)
                .send(body)
                .end((err, res) => {
                if (!res.ok) {
                    if (options.verbose) {
                        console.log(res);
                    }
                    const errorMessages = utils_1.default.extractErrorMessages(res).join('\n');
                    return console.log(errorMessages);
                }
                if (options.verbose) {
                    console.log(res);
                }
                console.log('Issue ' + res.body.key + ' created successfully!');
                console.log('Open ' + utils_1.default.url.resolve(config_1.default.auth.url, 'browse/' + res.body.key));
                return cb();
            });
        },
        create(options, cb) {
            async_1.default.waterfall([
                wcb => {
                    create.getMeta(null, (err, meta) => {
                        if (err) {
                            return wcb(err);
                        }
                        create.projects = meta;
                        return wcb(null, options);
                    });
                }, (options, wcb) => {
                    if (options.key && config_1.default.default_create && config_1.default.default_create[options.key] && config_1.default.default_create[options.key].project) {
                        if (!options.project && config_1.default.default_create[options.key].project) {
                            options.project = config_1.default.default_create[options.key].project;
                        }
                    }
                    create.askProject(options.project, (projectId, index, projectKey) => {
                        options.projectId = projectId;
                        options.projectIndex = index;
                        options.project = projectKey;
                        create.answers.fields.project = {
                            id: projectId
                        };
                        return wcb(null, options);
                    });
                }, (options, wcb) => {
                    create.getMeta(options.project, (err, meta) => {
                        if (err) {
                            return wcb(err);
                        }
                        meta.forEach(eachProjectMeta => {
                            if (eachProjectMeta.id === options.projectId) {
                                create.projectMeta = eachProjectMeta;
                            }
                        });
                        if (!create.projectMeta) {
                            return wcb('project meta not found');
                        }
                        return wcb(null, options);
                    });
                }, (options, wcb) => {
                    if (options.key && config_1.default.default_create && config_1.default.default_create[options.key] && config_1.default.default_create[options.key].issueType) {
                        if (!options.type && config_1.default.default_create[options.key].issueType) {
                            options.type = config_1.default.default_create[options.key].issueType;
                        }
                    }
                    create.askIssueType(options.type, issueType => {
                        create.answers.fields.issuetype = {
                            id: issueType
                        };
                        options.type = issueType;
                        create.projectMeta.issuetypes.forEach(eachIssueType => {
                            if (eachIssueType.id === issueType) {
                                create.issueType = eachIssueType;
                            }
                        });
                        if (!create.issueType) {
                            return wcb(new Error('invalid issue type'));
                        }
                        return wcb(null, options);
                    });
                }, (options, wcb) => {
                    async_1.default.eachSeries(Object.keys(create.issueType.fields), (eachFieldKey, scb) => {
                        const eachField = create.issueType.fields[eachFieldKey];
                        let defaultAnswer;
                        if (eachField.allowedValues && eachField.allowedValues.length === 1) {
                            defaultAnswer = eachField.allowedValues[0].id;
                            return scb();
                        }
                        if (options.verbose) {
                            console.log(options);
                            console.log({
                                eachField: eachField
                            });
                            console.log({
                                eachFieldKey: eachFieldKey
                            });
                        }
                        if (options.key && config_1.default.default_create && config_1.default.default_create[options.key] && config_1.default.default_create[options.key].default) {
                            if (config_1.default.default_create[options.key].default[eachFieldKey]) {
                                create.answers.fields[eachFieldKey] = config_1.default.default_create[options.key].default[eachFieldKey];
                                return scb();
                            }
                        }
                        if (options[eachFieldKey]) {
                            create.answers.fields[eachFieldKey] = options[eachFieldKey];
                            return scb();
                        }
                        return create.askRequired(eachField, eachFieldKey, defaultAnswer, scb);
                    }, () => wcb(null, options));
                }, (options, wcb) => {
                    create.saveIssue(options, wcb);
                }
            ], err => cb(err));
        }
    };
    return create;
}
exports.default = newFxn;
