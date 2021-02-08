import { client } from './helpers';
import inquirer from 'inquirer';

export interface JiraIssueType {
  self: string,
  id: string,
  description?: string,
  iconUrl?: string,
  name: string,
  subtask?: boolean,
  avatarId?: number,
  hierarchyLevel?: number,
}

export interface JiraProject {
  expand?: string;
  self?: string;
  id?: string;
  key?: string;
  description?: string;
  lead?: Lead;
  components?: any[];
  issueTypes?: IssueType[];
  assigneeType?: string;
  versions?: any[];
  name?: string;
  roles?: Roles;
  avatarUrls?: AvatarUrls;
  projectTypeKey?: string;
  simplified?: boolean;
  style?: string;
  isPrivate?: boolean;
  properties?: Properties;
  entityId?: string;
  uuid?: string;
}

export interface AvatarUrls {
  [key: string]: Record<string, string>
}

export interface Properties {
  [key: string]: string
}

export interface IssueType {
  self?: string;
  id?: string;
  description?: string;
  iconUrl?: string;
  name?: string;
  subtask?: boolean;
  avatarId?: number;
  hierarchyLevel?: number;
}

export interface Lead {
  self?: string;
  accountId?: string;
  avatarUrls?: AvatarUrls;
  displayName?: string;
  active?: boolean;
}

export interface Roles {
  'atlassian-addons-project-access'?: string;
  Administrator?: string;
  Viewer?: string;
  Member?: string;
}

export async function dynamicPrompt(fieldName: 'issueType' | 'project' | 'status' | 'priority' | 'details' | 'parentTask' | 'additional' | string, currentOptionsObject: Record<string, string>, predefinedOptions?: Record<string, unknown>): Promise<void> {
  switch (fieldName) {
    case 'issueType':
      // if (!currentOptionsObject['project']) throw new TypeError('Project reference required');
      try {
        return await issueTypePrompt(currentOptionsObject['parent'], currentOptionsObject);
      } catch (e) {
        console.error(e);
      }
      break;
    case 'project':
      try {
        return await projectPrompt(currentOptionsObject, null);
      } catch (e) {
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
      } catch (e) {
        console.error(e);
      }
      break;
    case 'parentTask':
      try {
        return await parentTaskPrompt(currentOptionsObject, predefinedOptions);
      } catch (e) {
        console.error(e);
      }
      break;
    case 'additional':
      try {
        return await additionalFields(currentOptionsObject);
      } catch (e) {
        console.error(e);
      }
      break;
    default:
      break;

  }
}

const additionalFields = async (currentAnswers: Record<string, unknown>) => {
  if (!currentAnswers.project) throw new Error();

  const createMeta = await client.issues.getCreateIssueMetadata({
    projectKeys: [currentAnswers.project['key']],
    issuetypeIds: [currentAnswers.issueType['id']]
  });
  return createMeta;
};


const issueDetails = async (currentAnswers: Record<string, unknown>) => {
  const detailQuestions: inquirer.QuestionCollection = [
    {
      name: 'summary',
      message: 'enter the issue summary',
      type: 'input'
    },
    {
      name: 'description',
      type: 'input',
      message: 'Enter the issue details'
    }];
  const answers = await inquirer.prompt(detailQuestions);
  currentAnswers.summary = answers.summary;
  currentAnswers.description = answers.description;
}
;

const projectPrompt = async (currentAnswers: Record<string, unknown>, defaultProject?: string | JiraProject) => {
  const projects = await client.projects.getAllProjects({ expand: 'issueTypes' });
  const answer = await inquirer.prompt({
    // @ts-ignore
    type: 'search-list',
    name: 'project',
    choices: projects.map(x => {
      return { name: x.name, value: x };
    }),
    message: 'choose a project'
  });
  currentAnswers.project = answer.project;

  // return projects.find(x => x.name === answer.project);
};
const fillSuggestions = async (currentInput: string, project) => {
  const response = await client.issueSearch.getIssuePickerSuggestions({
    query: currentInput,
    currentProjectId: project.id
  });
  return response.sections.flatMap(x => x.issues).filter(x=>x.status !== 'Done');
};
const parentTaskPrompt = async (currentAsnwers: Record<string, unknown>, userPreferences?: Record<string, unknown>) => {
  if (!currentAsnwers.project) throw new Error('parent project must be selected before choosing a parent task');
  const tasksList = (await fillSuggestions('', currentAsnwers.project)).map(x => ({
    name: x['summary'] ?? 'unk',
    value: x
  }));
  const answer = await inquirer.prompt({
    // @ts-ignore
    type: 'autocomplete',
    name: 'parentTask',
    choices: tasksList,
    message: 'Choose parent task?',
    source: async (answersSoFar, input) => {
      return (await fillSuggestions(input, currentAsnwers.project)).map(x=>({name: x['summary'], value: x}));
    },
    // validate: async input => {
    //   // const response = await fillSuggestions(input, currentAsnwers.project);
    //   // tasksList = response.map(x => ({ name: x['summary'], value: x }));
    //   if (!input)
    //     return 'no input';
    //   // return tasksList.length > 0;
    //   return true;
    // }

  });
  currentAsnwers.parentTask = answer.parentTask;

};
const issueTypePrompt = async (parentProject: string | { issueTypes: any[] }, currentAnswers: Record<string, unknown>) => {
  const issueTypes: JiraIssueType[] = [];

  // check if parent project contains issueType information (use it if so)
  if (currentAnswers.project) issueTypes.push(...currentAnswers.project['issueTypes']);
  else if (parentProject && parentProject.hasOwnProperty('issueTypes')) issueTypes.push(...parentProject['issueTypes']);
  else if (typeof parentProject === 'string') {

    const project = await client.projects.getProject({ projectIdOrKey: parentProject });
    issueTypes.push(...project.issueTypes);

  }


  const answer = await inquirer.prompt({
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
