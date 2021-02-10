"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.dynamicPrompt = exports.issueTypePrompt = exports.parentTaskPrompt = exports.getIssueSuggestions = exports.projectPrompt = exports.askIssueSummaryAndDetails = exports.additionalFields = void 0;
const helpers_1 = require("./helpers");
const inquirer_1 = __importDefault(require("inquirer"));
const additionalFields = async (currentAnswers) => {
    if (!currentAnswers.project)
        throw new Error();
    const availableFields = await getAdditionalFields(currentAnswers);
    const questions = [];
    // TODO: this
};
exports.additionalFields = additionalFields;
const getAdditionalFields = async (currentAnswers) => {
    const createMeta = await helpers_1.client.issues.getCreateIssueMetadata({
        projectKeys: [currentAnswers.project['key']],
        issuetypeIds: [currentAnswers.issueType['id']],
        expand: 'projects,issuetypes,fields,projects.issuetypes.fields'
    });
    return createMeta.projects[0].issueTypes[0].fields.map(x => x.fields);
};
const askIssueSummaryAndDetails = async (currentAnswers) => {
    const detailQuestions = [
        {
            name: 'summary',
            message: 'enter the issue summary',
            type: 'input',
            validate: (input, answers) => {
                return input.trim();
            }
        },
        {
            name: 'description',
            type: 'input',
            message: 'Enter the issue details'
        }
    ];
    const answers = await inquirer_1.default.prompt(detailQuestions);
    currentAnswers.summary = answers.summary;
    currentAnswers.description = answers.description;
};
exports.askIssueSummaryAndDetails = askIssueSummaryAndDetails;
const projectPrompt = async (currentAnswers, defaultProject) => {
    const projects = [...new Set((await helpers_1.client.projects.getAllProjects({ expand: 'issueTypes' })))].map(x => ({
        name: x['name'],
        value: x
    }));
    const question = {
        // @ts-ignore
        type: 'autocomplete',
        name: 'project',
        choices: projects,
        source: () => Promise.resolve(projects),
        message: 'choose a project',
        default: (defaultProject && typeof defaultProject !== 'string') ? defaultProject.name : null
    };
    const answer = await inquirer_1.default.prompt(question);
    currentAnswers.project = answer.project;
    // return projects.find(x => x.name === answer.project);
};
exports.projectPrompt = projectPrompt;
const getIssueSuggestions = async (currentInput, project) => {
    const response = await helpers_1.client.issueSearch.getIssuePickerSuggestions({
        query: currentInput,
        currentProjectId: project.id
    });
    return response.sections.flatMap(x => x.issues).filter(x => x.status !== 'Done');
};
exports.getIssueSuggestions = getIssueSuggestions;
const parentTaskPrompt = async (currentAnswers, userPreferences) => {
    if (!currentAnswers.project)
        throw new Error('parent project must be selected before choosing a parent task');
    const tasksList = (await exports.getIssueSuggestions('', currentAnswers.project)).map(x => ({
        name: x['summary'] ?? 'unk',
        value: x
    }));
    const answer = await inquirer_1.default.prompt({
        // @ts-ignore
        type: 'autocomplete',
        name: 'parentTask',
        choices: tasksList,
        message: 'Choose parent task?',
        source: async (answersSoFar, input) => {
            return (await exports.getIssueSuggestions(input, currentAnswers.project)).map(x => ({ name: x['summary'], value: x }));
        }
    });
    currentAnswers.parentTask = answer.parentTask;
};
exports.parentTaskPrompt = parentTaskPrompt;
const issueTypePrompt = async (currentAnswers) => {
    const issueTypes = [];
    // check if parent project contains issueType information (use it if so)
    if (currentAnswers.project)
        issueTypes.push(...currentAnswers.project.issueTypes);
    else
        throw new ReferenceError('parent project missing in answers object');
    const answer = await inquirer_1.default.prompt({
        type: 'list',
        choices: [...(new Set(issueTypes))].map(x => {
            return { name: x.name, value: x };
        }),
        message: 'choose an issue type',
        name: 'issueType'
    });
    // chenging the property allows us to modify the options object in the calling context
    currentAnswers.issueType = answer.issueType;
};
exports.issueTypePrompt = issueTypePrompt;
async function dynamicPrompt(fieldName, currentOptionsObject, predefinedOptions) {
    switch (fieldName) {
        case 'issueType':
            // if (!currentOptionsObject['project']) throw new TypeError('Project reference required');
            try {
                return await exports.issueTypePrompt(currentOptionsObject);
            }
            catch (e) {
                console.error(e);
            }
            break;
        case 'project':
            try {
                return await exports.projectPrompt(currentOptionsObject, predefinedOptions['cache']['recent']['project']);
            }
            catch (e) {
                console.log(e);
            }
            break;
        case 'status':
            break;
        case 'priority':
            break;
        case 'details':
            try {
                return await exports.askIssueSummaryAndDetails(currentOptionsObject);
            }
            catch (e) {
                console.error(e);
            }
            break;
        case 'parentTask':
            try {
                return await exports.parentTaskPrompt(currentOptionsObject, predefinedOptions);
            }
            catch (e) {
                console.error(e);
            }
            break;
        case 'additional':
            try {
                return await exports.additionalFields(currentOptionsObject);
            }
            catch (e) {
                console.error(e);
            }
            break;
        default:
            break;
    }
}
exports.dynamicPrompt = dynamicPrompt;
