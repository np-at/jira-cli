import { client } from './helpers';
import inquirer, { QuestionCollection } from 'inquirer';
import { UserAnswersObject } from '../jira/create';
import { IssueResponse } from 'jira-connector/types/api';

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


export const additionalFields = async (currentAnswers: UserAnswersObject) => {
  if (!currentAnswers.project) throw new Error();
  const availableFields = await getAdditionalFields(currentAnswers);
  const questions: QuestionCollection = [];
// TODO: this
};
const getAdditionalFields = async (currentAnswers: UserAnswersObject): Promise<Record<string, unknown>[]> => {
  const createMeta = await client.issues.getCreateIssueMetadata({
    projectKeys: [currentAnswers.project['key']],
    issuetypeIds: [currentAnswers.issueType['id']],
    expand: 'projects,issuetypes,fields,projects.issuetypes.fields'
  });
  return createMeta.projects[0].issueTypes[0].fields.map(x => x.fields);
};


export const askIssueSummaryAndDetails = async (currentAnswers: UserAnswersObject): Promise<void> => {
  const detailQuestions: inquirer.QuestionCollection = [
    {
      name: 'summary',
      message: 'enter the issue summary',
      type: 'input',
      validate: (input: any, answers?) => {
        return input.trim() !== '';
      }
    },
    {
      name: 'description',
      type: 'input',
      message: 'Enter the issue details'
    }];
  const answers = await inquirer.prompt(detailQuestions);
  currentAnswers.summary = answers.summary;
  currentAnswers.description = answers.description;
};

export const projectPrompt = async (currentAnswers: UserAnswersObject,  userConfigPreferences: Record<string, unknown>): Promise<void> => {
  let projects = [...new Set((await client.projects.getAllProjects({ expand: 'issueTypes' })))].map(x => ({
    name: x['name'],
    value: x
  }));

  // if recent project exists in the cache, put that at the top of the prompt list
  const defaultChoice = userConfigPreferences?.cache?.['recent']?.['project']?.['name'];
  if (defaultChoice)  {
    projects = projects.sort((a, b)=> {
      if (a.name === defaultChoice)
        return -1;
      else if (b.name === defaultChoice)
        return 1;
      else
        return 0;
    });
  }

  // 'default' param doesn't work for list type prompts
  const question: QuestionCollection = {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    type: 'autocomplete',
    name: 'project',
    choices: projects,
    source: () => Promise.resolve(projects),
    message: 'choose a project',
    loop: false
  };

  const answer = await inquirer.prompt(question);
  currentAnswers.project = answer.project;

};
export const getIssueSuggestions = async (currentInput: string, project: JiraProject): Promise<Array<IssueResponse>> => {
  const response = await client.issueSearch.getIssuePickerSuggestions({
    query: currentInput,
    currentProjectId: project.id
  });
  return response.sections.flatMap(x => x.issues).filter(x => x.status !== 'Done');
};
export const parentTaskPrompt = async (currentAnswers: UserAnswersObject, userPreferences?: Record<string, unknown>): Promise<void> => {
  if (!currentAnswers.project) throw new Error('parent project must be selected before choosing a parent task');
  const tasksList = (await getIssueSuggestions('', currentAnswers.project)).map(x => ({
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
      return (await getIssueSuggestions(input, currentAnswers.project)).map(x => ({ name: x['summary'], value: x }));
    }

  });
  currentAnswers.parentTask = answer.parentTask;

};
export const issueTypePrompt = async (currentAnswers: UserAnswersObject): Promise<void> => {
  const issueTypes: IssueType[] = [];
  // check if parent project contains issueType information (use it if so)
  if (currentAnswers.project) issueTypes.push(...currentAnswers.project.issueTypes);
  else throw new ReferenceError('parent project missing in answers object');

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

};

// export async function dynamicPrompt(fieldName: 'issueType' | 'project' | 'status' | 'priority' | 'details' | 'parentTask' | 'additional' | string, currentOptionsObject: UserAnswersObject, predefinedOptions?: Record<string, unknown>): Promise<void> {
//   switch (fieldName) {
//     case 'issueType':
//       // if (!currentOptionsObject['project']) throw new TypeError('Project reference required');
//       try {
//         return await issueTypePrompt(currentOptionsObject);
//       } catch (e) {
//         console.error(e);
//       }
//       break;
//     case 'project':
//       try {
//         return await projectPrompt(currentOptionsObject, predefinedOptions['cache']['recent']['project']);
//       } catch (e) {
//         console.log(e);
//       }
//       break;
//     case 'status':
//       break;
//     case 'priority':
//       break;
//     case 'details':
//       try {
//         return await askIssueSummaryAndDetails(currentOptionsObject);
//       } catch (e) {
//         console.error(e);
//       }
//       break;
//     case 'parentTask':
//       try {
//         return await parentTaskPrompt(currentOptionsObject, predefinedOptions);
//       } catch (e) {
//         console.error(e);
//       }
//       break;
//     case 'additional':
//       try {
//         return await additionalFields(currentOptionsObject);
//       } catch (e) {
//         console.error(e);
//       }
//       break;
//     default:
//       break;
//
//   }
// }
