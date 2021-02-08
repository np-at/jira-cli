"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.dynamicPrompt = void 0;
const helpers_1 = require("./helpers");
const inquirer_1 = __importDefault(require("inquirer"));
async function dynamicPrompt(fieldName, currentOptionsObject, predefinedOptions) {
    switch (fieldName) {
        case 'issueType':
            // if (!currentOptionsObject['project']) throw new TypeError('Project reference required');
            try {
                return await issueTypePrompt(currentOptionsObject['parent'], currentOptionsObject);
            }
            catch (e) {
                console.error(e);
            }
            break;
        case 'project':
            try {
                return await projectPrompt(currentOptionsObject, null);
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
                return await issueDetails(currentOptionsObject);
            }
            catch (e) {
                console.error(e);
            }
            break;
        case 'parentTask':
            try {
                return await parentTaskPrompt(currentOptionsObject, predefinedOptions);
            }
            catch (e) {
                console.error(e);
            }
            break;
        case 'additional':
            try {
                return await additionalFields(currentOptionsObject);
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
const additionalFields = async (currentAnswers) => {
    if (!currentAnswers.project)
        throw new Error();
    const availableFields = await getAdditionalFields(currentAnswers);
    const questions = [];
    // TODO: this
};
const getAdditionalFields = async (currentAnswers) => {
    const createMeta = await helpers_1.client.issues.getCreateIssueMetadata({
        projectKeys: [currentAnswers.project['key']],
        issuetypeIds: [currentAnswers.issueType['id']],
        expand: 'projects,issuetypes,fields,projects.issuetypes.fields'
    });
    return createMeta.projects[0].issueTypes[0].fields.map(x => x.fields);
};
const issueDetails = async (currentAnswers) => {
    const detailQuestions = [
        {
            name: 'summary',
            message: 'enter the issue summary',
            type: 'input'
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
const projectPrompt = async (currentAnswers, defaultProject) => {
    const projects = (await helpers_1.client.projects.getAllProjects({ expand: 'issueTypes' })).map(x => ({
        name: x.name,
        value: x
    }));
    const answer = await inquirer_1.default.prompt({
        // @ts-ignore
        type: 'autocomplete',
        name: 'project',
        choices: projects,
        source: () => Promise.resolve(projects),
        message: 'choose a project'
    });
    currentAnswers.project = answer.project;
    // return projects.find(x => x.name === answer.project);
};
const fillSuggestions = async (currentInput, project) => {
    const response = await helpers_1.client.issueSearch.getIssuePickerSuggestions({
        query: currentInput,
        currentProjectId: project.id
    });
    return response.sections.flatMap(x => x.issues).filter(x => x.status !== 'Done');
};
const parentTaskPrompt = async (currentAnswers, userPreferences) => {
    if (!currentAnswers.project)
        throw new Error('parent project must be selected before choosing a parent task');
    const tasksList = (await fillSuggestions('', currentAnswers.project)).map(x => ({
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
            return (await fillSuggestions(input, currentAnswers.project)).map(x => ({ name: x['summary'], value: x }));
        }
        // validate: async input => {
        //   // const response = await fillSuggestions(input, currentAnswers.project);
        //   // tasksList = response.map(x => ({ name: x['summary'], value: x }));
        //   if (!input)
        //     return 'no input';
        //   // return tasksList.length > 0;
        //   return true;
        // }
    });
    currentAnswers.parentTask = answer.parentTask;
};
const issueTypePrompt = async (parentProject, currentAnswers) => {
    const issueTypes = [];
    // check if parent project contains issueType information (use it if so)
    if (currentAnswers.project)
        issueTypes.push(...currentAnswers.project['issueTypes']);
    else if (parentProject && parentProject.hasOwnProperty('issueTypes'))
        issueTypes.push(...parentProject['issueTypes']);
    else if (typeof parentProject === 'string') {
        const project = await helpers_1.client.projects.getProject({ projectIdOrKey: parentProject });
        issueTypes.push(...project.issueTypes);
    }
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
    // return ist.find(x => x.name === choice.name);
};
