"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const inquirer_1 = __importDefault(require("inquirer"));
const helpers_1 = require("../helpers/helpers");
const config_1 = __importDefault(require("../config"));
const PromptHelpers_1 = require("../helpers/PromptHelpers");
const inquirer_autocomplete_prompt_1 = __importDefault(require("inquirer-autocomplete-prompt"));
const cache_1 = __importDefault(require("../helpers/cache"));
const printError = messages => {
    console.log(messages.join('\n'));
};
exports.default = async (prog, extCallback) => {
    inquirer_1.default.registerPrompt('autocomplete', inquirer_autocomplete_prompt_1.default);
    prog
        .command('create [project[-issue]]')
        .description('Create an issue or a sub-task')
        .option('-p, --project <project>', 'Rapid board on which project is to be created', String)
        .option('-P, --priority <priority>', 'priority of the issue', String)
        .option('-T --type <type>', 'NUMERIC Issue type', parseInt)
        .option('-s --subtask <subtask>', 'Issue subtask', undefined)
        .option('-S --summary <summary>', 'Issue Summary', undefined)
        .option('-d --details <details>', 'Issue details', undefined)
        .option('-a --assignee <assignee>', 'Issue assignee', undefined)
        .option('-v --verbose', 'Verbose debugging output')
        .action(async (projIssue, options) => {
        options.parent = projIssue || undefined;
        let err, results;
        try {
            results = await assembleCreationParameters(options);
        }
        catch (e) {
            err = e;
        }
        finally {
            extCallback(err, results);
        }
    });
};
const assembleCreationParameters = async (options) => {
    const userConfigPrefs = { ...config_1.default.default_create.__always_ask.fields };
    const cache = new cache_1.default();
    Object.assign(userConfigPrefs, options);
    userConfigPrefs.cache = cache.recent;
    const e = {};
    await PromptHelpers_1.projectPrompt(e, userConfigPrefs);
    await PromptHelpers_1.issueTypePrompt(e);
    if (e.issueType?.subtask === true)
        await PromptHelpers_1.parentTaskPrompt(e, userConfigPrefs);
    const epics = await helpers_1.client.issueSearch.searchForIssuesUsingJqlGet({ jql: `project=${e['project']['id']} AND issueType = "Epic" AND status != "Done"` });
    const defaultEpic = userConfigPrefs.cache?.['recent']?.['epic']?.['fields']?.['summary'];
    if (!e['parentTask'] && (await inquirer_1.default.prompt({
        name: 'epicChild',
        type: 'confirm',
        default: true
    })).epicChild === true) {
        const epicParent = await inquirer_1.default.prompt({
            type: 'list',
            choices: epics.issues.map(x => ({ name: x.fields.summary, value: x })).sort((a, b) => {
                if (!defaultEpic)
                    return 0;
                if (a.name === defaultEpic)
                    return -1;
                else if (b.name === defaultEpic)
                    return 1;
                else
                    return 0;
            }),
            name: 'epicParentAnswer'
        });
        e.epicParent = epicParent.epicParentAnswer;
    }
    await PromptHelpers_1.askIssueSummaryAndDetails(e);
    const currentUser = await helpers_1.client.myself.getCurrentUser();
    const assignee = await inquirer_1.default.prompt({
        name: 'assignee',
        type: 'list',
        choices: [{ name: currentUser.name ?? currentUser.emailAddress, value: currentUser }],
        default: currentUser.name ?? currentUser.emailAddress
    });
    e.assignee = assignee.assignee;
    const requestFieldsObject = {
        project: {
            id: e.project.id
        },
        assignee: {
            id: e.assignee.accountId
        },
        summary: e.summary,
        issuetype: {
            id: e.issueType.id
        },
        description: e.description
    };
    if (e.parentTask)
        requestFieldsObject['parent'] = { id: e.parentTask.id };
    else if (e.epicParent)
        requestFieldsObject['parent'] = { id: e.epicParent.id };
    try {
        const response = await helpers_1.client.issues.createIssue({ fields: requestFieldsObject });
        console.debug(response);
        cache.recent = { project: e.project, epic: e.epicParent };
    }
    catch (e) {
        console.error(e);
    }
};
const parseNewOptions = async (options) => {
    const fields = {};
    if (options.parent) {
        const parent = await helpers_1.client.issue.getIssue({ issueIdOrKey: options.parent });
        fields['parent'] = { key: parent.key };
    }
    const project = await helpers_1.client.projects.getAllProjects();
    console.log(project);
    return project;
};
