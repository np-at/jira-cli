"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.selectProject = exports.fetchIssues = exports.client = exports.getMainTextColWidth = exports.promptForProject = exports.parseProjIssue = void 0;
const jira_js_1 = require("jira.js");
const config_1 = __importDefault(require("../config"));
const inquirer_1 = __importDefault(require("inquirer"));
const parseProjIssue = (projIssue) => {
    if (!projIssue)
        return;
    const split = projIssue.split('-');
    const project = split?.shift() ?? undefined;
    const issueId = split?.join('-') ?? undefined;
    // if (split.length > 1) {
    //   options.parent = parent = split[1];
    //   console.log("Creating subtask for issue " + projIssue);
    // } else {
    //   console.log("Creating issue in project " + projIssue);
    // }
    return { project: project, issueId: issueId };
};
exports.parseProjIssue = parseProjIssue;
const promptForProject = () => {
    const projects = exports.client;
};
exports.promptForProject = promptForProject;
const getMainTextColWidth = (otherColTotal) => {
    return (process.stdout.columns || 200) - otherColTotal;
};
exports.getMainTextColWidth = getMainTextColWidth;
const _getClient = () => {
    if (config_1.default && config_1.default.auth)
        return new jira_js_1.Client({
            host: config_1.default.auth.url,
            authentication: {
                basic: {
                    username: config_1.default.auth.user,
                    apiToken: Buffer.from(config_1.default.auth.token, 'base64').toString('utf-8').split(':', 2)[1]
                }
            },
            baseRequestConfig: {
                withCredentials: true
            }
        });
    throw new Error();
};
exports.client = _getClient();
const fetchIssues = async (currentOptions) => {
    // const client1 = new JiraCon({
    //   host: new URL.URL(config.auth.url).host,
    //   basic_auth: { email: config.auth.user, api_token: config.auth.token }
    //
    // });
    try {
        return await exports.client.issues.getCreateIssueMetadata(undefined);
    }
    catch (e) {
        console.error(e);
    }
};
exports.fetchIssues = fetchIssues;
const selectProject = async () => {
    const projects = await exports.client.projects.getAllProjects({});
    const asnwer = inquirer_1.default.prompt({ name: 'Choose Project', type: 'list', message: 'choose one', choices: projects });
};
exports.selectProject = selectProject;
