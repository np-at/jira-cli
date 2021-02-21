import inquirer from 'inquirer';
import { jiraclCreateOptions } from '../entrypoint';
import commander from 'commander';
import { client } from '../helpers/helpers';
import { IssueResponse, SearchResult, UserInfo } from 'jira-connector/types/api';
import config from '../config';
import {
  askIssueSummaryAndDetails,
  issueTypePrompt,
  JiraIssueType,
  JiraProject,
  parentTaskPrompt,
  projectPrompt
} from '../helpers/PromptHelpers';

import inquirer_autocomplete_prompt from 'inquirer-autocomplete-prompt';
import Cache from '../helpers/cache';


const printError = messages => {
  console.log(messages.join('\n'));
};


export default async (prog: commander.Command, extCallback: (errors: Error, dataResults: unknown) => void): Promise<void> => {
  inquirer.registerPrompt('autocomplete', inquirer_autocomplete_prompt);

  prog
    .command('create [project[-issue]]')
    .description('Create an issue or a sub-task')
    .option<string>('-p, --project <project>', 'Rapid board on which project is to be created', String)
    .option<string>('-P, --priority <priority>', 'priority of the issue', String)
    .option('-T --type <type>', 'NUMERIC Issue type', parseInt)
    .option<string>('-s --subtask <subtask>', 'Issue subtask', undefined)
    .option('-S --summary <summary>', 'Issue Summary', undefined)
    .option('-d --details <details>', 'Issue details', undefined)
    .option('-a --assignee <assignee>', 'Issue assignee', undefined)
    .option('-v --verbose', 'Verbose debugging output')
    .action(async (projIssue, options: jiraclCreateOptions) => {
      options.parent = projIssue || undefined;

      let err, results;
      try {
        results = await assembleCreationParameters(options);
      } catch (e) {
        err = e;
      } finally {
        extCallback(err, results);
      }

    });
};


export interface UserAnswersObject {
  project?: JiraProject,
  issueType?: JiraIssueType,
  summary?: string,
  description?: string,
  parentTask?: IssueResponse,
  isSubTask?: boolean,
  assignee?: UserInfo,
  epicParent?: IssueResponse

}

const assembleCreationParameters = async (options: jiraclCreateOptions) => {
  // get default user prefences from config file
  const userConfigPrefs: Record<string, unknown> = { ...config.default_create.__always_ask.fields };
  const cache = new Cache();
  //override preferences and merge with any explicitly defined cli parameters
  Object.assign(userConfigPrefs, options);

  userConfigPrefs['cache'] = { recent: cache.recent };


  const e: UserAnswersObject = {};

  await projectPrompt(e, userConfigPrefs);
  // await dynamicPrompt('project', e, userConfigPrefs);

  await issueTypePrompt(e);
  // await dynamicPrompt('issueType', e, userConfigPrefs);

  if (e.issueType?.subtask === true)
    await parentTaskPrompt(e, userConfigPrefs);
  // await dynamicPrompt('parentTask', e, userConfigPrefs);


  const epics: SearchResult = await client.issueSearch.searchForIssuesUsingJqlGet({ jql: `project=${e['project']['id']} AND issueType = "Epic" AND status != "Done"` });
  const defaultEpic = userConfigPrefs.cache?.['recent']?.['epic']?.['fields']?.['summary'];
  if (!e['parentTask'] && (await inquirer.prompt({
    name: 'epicChild',
    type: 'confirm',
    default: true
  })).epicChild === true) {

    const epicParent = await inquirer.prompt({
      type: 'list',
      choices: epics.issues.map(x => ({ name: x.fields.summary, value: x })).sort((a, b) => {
        if (!defaultEpic) return 0;
        if (a.name === defaultEpic) return -1;
        else if (b.name === defaultEpic) return 1;
        else return 0;
      }),
      name: 'epicParentAnswer'
    });
    e.epicParent = epicParent.epicParentAnswer;
  }
  await askIssueSummaryAndDetails(e);
  // await dynamicPrompt('details', e, userConfigPrefs);
  const currentUser: UserInfo = await client.myself.getCurrentUser();
  const assignee = await inquirer.prompt({
    name: 'assignee',
    type: 'list',
    choices: [{ name: currentUser.name ?? currentUser.emailAddress, value: currentUser }],
    default: currentUser.name ?? currentUser.emailAddress
  });
  e.assignee = assignee.assignee;
  // getCreateMeta not working atm
  // await dynamicPrompt('additional', e, userConfigPrefs);

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
    const response = await client.issues.createIssue({ fields: requestFieldsObject });
    console.debug(response);
    cache.recent = { project: e.project, epic: e.epicParent, issueType: e.issueType };
  } catch (err) {
    console.error(err);
  }
  // await dynamicPrompt('additional', e, userConfigPrefs);


  // any options that are explicitly null can be assumed to come fro the config file
  // and need input from the user
  // Object.keys(userConfigPrefs).filter(x => x === null).forEach(x => {
  //
  // });
  // client.issues.createIssue({fields: userConfigPrefs})
  // const creationOptions;
};
const parseNewOptions = async (options: jiraclCreateOptions) => {
  const fields = {};
  if (options.parent) {
    const parent: IssueResponse = await client.issue.getIssue({ issueIdOrKey: options.parent });
    fields['parent'] = { key: parent.key };
  }
  // client.issues.createIssue({});

  const project = await client.projects.getAllProjects();
  console.log(project);
  return project;
};
