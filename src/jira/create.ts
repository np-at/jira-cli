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
} from '../helpers/DynamicPrompt';

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

  userConfigPrefs.cache = await cache.get();


  const e: UserAnswersObject = {};

  await projectPrompt(e, userConfigPrefs);
  // await dynamicPrompt('project', e, userConfigPrefs);

  await issueTypePrompt(e);
  // await dynamicPrompt('issueType', e, userConfigPrefs);

  if (e.issueType?.subtask === true)
    await parentTaskPrompt(e, userConfigPrefs);
  // await dynamicPrompt('parentTask', e, userConfigPrefs);


  const epics: SearchResult = await client.issueSearch.searchForIssuesUsingJqlGet({ jql: `project=${e['project']['id']} AND issueType = "Epic" AND status != "Done"` });
  const defaultEpic = userConfigPrefs.cache['recent']?.['epic']?.['fields']?.['summary'] ?? undefined;
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
    await cache.set({ recent: { project: e.project, epic: e.epicParent } });
  } catch (e) {
    console.error(e);
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

//
// function creation(jira) {
//   const create = {
//     query: null,
//     table: null,
//     isSubTask: false,
//     projects: [],
//     priorities: [],
//     answers: {
//       fields: {}
//     },
//     ask: function(question, callback, yesno, values, answer) {
//       let that = this,
//         options = {},
//         issueTypes = [],
//         i = 0;
//
//       if (answer || answer === false) {
//         return callback(answer);
//       }
//
//       if (values && values.length > 0) {
//         for (i; i < values.length; i++) {
//           if (that.isSubTask) {
//             if (values[i].subtask !== undefined) {
//               if (values[i].subtask) {
//                 issueTypes.push('(' + values[i].id + ') ' + values[i].name);
//               }
//             } else {
//               issueTypes.push('(' + values[i].id + ') ' + values[i].name);
//             }
//           } else {
//             if (!values[i].subtask) {
//               issueTypes.push('(' + values[i].id + ') ' + values[i].name);
//             }
//           }
//         }
//
//         console.log(issueTypes.join('\n'));
//       }
//
//       inquirer.prompt({ message: question, name: question }, function(answer) {
//         if (answer.length > 0) {
//           callback(answer);
//         } else {
//           if (yesno) {
//             callback(false);
//           } else {
//             that.ask(question, callback);
//           }
//         }
//       });
//     },
//     askProject: function(project, callback) {
//       let that = this,
//         i = 0;
//       this.ask('Type the project name or key: ', function(answer) {
//         let projectId = 0,
//           index = 0;
//         answer = answer.charAt(0).toUpperCase() + answer.substring(1).toLowerCase();
//
//         for (i; i < that.projects.length; i++) {
//           if (answer == that.projects[i].key || answer.toUpperCase() == that.projects[i].key) {
//             projectId = that.projects[i].id;
//             index = i;
//           } else if (answer == that.projects[i].name) {
//             projectId = that.projects[i].id;
//             index = i;
//           }
//         }
//
//         if (projectId > 0) {
//           callback(projectId, index);
//         } else {
//           console.log('Project "' + answer + '" does not exists.');
//           that.askProject(project, callback);
//         }
//       }, null, null, project);
//     },
//     askSubTask: function(subtask, callback) {
//       const that = this;
//       that.ask('Type the parent task key (only the numbers) if exists, otherwise press enter: ', function(answer) {
//         if (answer === false || parseInt(answer) > 0) {
//           that.isSubTask = answer ? true : false;
//           callback(answer);
//         } else {
//           console.log('Please, type only the task number (ex: if issue is "XXX-324", type only "324").');
//           that.askSubTask(subtask, callback);
//         }
//       }, true, null, subtask);
//     },
//     askIssueType: function(type, callback) {
//       const that = this,
//         issueTypeArray = that.project.issuetypes;
//       that.ask('Select issue type: ', function(issueType) {
//         callback(issueType);
//       }, false, issueTypeArray, type);
//     },
//     askIssuePriorities: function(priority, callback) {
//       const that = this,
//         issuePriorities = that.priorities;
//       that.ask('Select the priority: ', function(issuePriority) {
//         callback(issuePriority);
//       }, false, issuePriorities, priority);
//     },
//     newIssue: function(projIssue: string, options: jiraclCreateOptions) {
//       const that = this;
//       options ??= {};
//       let project = typeof projIssue === 'string' ? projIssue : undefined;
//       let parent = undefined;
//
//       if (project !== undefined) {
//         const split = project.split('-');
//         options.project = project = split[0];
//
//         if (split.length > 1) {
//           options.parent = parent = split[1];
//           console.log('Creating subtask for issue ' + projIssue);
//         } else {
//           console.log('Creating issue in project ' + project);
//         }
//       }
//       that.getMeta(function(error, meta) {
//         if (error) {
//           printError(error.messages);
//           process.stdin.destroy();
//           return;
//         }
//         that.projects = meta;
//         that.askProject(options?.project, function(projectId, index) {
//           that.project = that.projects[index];
//           that.answers.fields.project = {
//             id: projectId
//           };
//
//           if (!options.subtask && (options.priority || options.type || options.summary || options.description)) {
//             options.subtask = false;
//           }
//
//           that.askSubTask(options.subtask, function(taskKey) {
//             if (taskKey) {
//               that.answers.fields.parent = {
//                 key: that.project.key + '-' + taskKey
//               };
//             }
//
//             that.askIssueType(options.type, function(issueTypeId) {
//               that.answers.fields.issuetype = {
//                 id: issueTypeId
//               };
//               that.ask('Type the issue summary: ', function(issueSummary) {
//                 that.answers.fields.summary = issueSummary;
//                 that.ask('Type the issue details: ', function(issueDescription) {
//                   const defaultAnswer = issueSummary;
//
//                   if (!issueDescription) {
//                     that.answer.fields.description = defaultAnswer;
//                   } else {
//                     that.answers.fields.description = issueDescription;
//                   }
//
//                   process.stdin.destroy();
//                   that.saveIssue(options);
//                 }, null, null, options.description);
//               }, null, null, options.summary);
//             });
//           });
//         });
//       });
//     },
//     getMeta: function(callback) {
//       jira.issue.getCreateMetadata({})
//         .then(data => {
//           callback(undefined, data.projects);
//         }, response => {
//           callback({ messages: utils.extractErrorMessages(response) }, undefined);
//         });
//     },
//
//     saveIssue: function() {
//       jira.issue.createIssue(this.answers)
//         .then(data => {
//           console.log(`Issue ${data.key} created successfully!`);
//         }, response => {
//           const errorMessages = utils.extractErrorMessages(response);
//           printError(errorMessages);
//         });
//     }
//   };
//   return create;
// }


//
// let project,
//   query,
//   table,
//   isSubTask,
//   properties,
//   projects,
//   priorities,
//   answers,
//   jira,
//   _jira: JiraClient;
//
//
//
// const ask = (question, callback, yesno?: boolean, values?, answer?) => {
//
//   const options = {},
//     issueTypes = [];
//
//   if (answer || answer === false) {
//     return callback(answer);
//   }
//
//   if (values && values.length > 0) {
//     for (let i = 0; i < values.length; i++) {
//       if (isSubTask) {
//         if (values[i].subtask !== undefined) {
//           if (values[i].subtask) {
//             issueTypes.push('(' + values[i].id + ') ' + values[i].name);
//           }
//         } else {
//           issueTypes.push('(' + values[i].id + ') ' + values[i].name);
//         }
//       } else {
//         if (!values[i].subtask) {
//           issueTypes.push('(' + values[i].id + ') ' + values[i].name);
//         }
//       }
//     }
//
//     console.log(issueTypes.join('\n'));
//   }
//
//   prompt({ message: question }).then((answer) => {
//     if ((answer as string).length > 0) {
//       callback(answer);
//     } else {
//       if (yesno) {
//         callback(false);
//       } else {
//         ask(question, callback);
//       }
//     }
//   });
// };
// const askProject = (project, callback) => {
//   ask('Type the project name or key: ', function(answer) {
//     let projectId = 0,
//       index = 0;
//     answer = answer.charAt(0).toUpperCase() + answer.substring(1).toLowerCase();
//
//     for (let i; i < projects.length; i++) {
//       if (answer === projects[i].key || answer.toUpperCase() === this.projects[i].key) {
//         projectId = this.projects[i].id;
//         index = i;
//       } else if (answer === this.projects[i].name) {
//         projectId = this.projects[i].id;
//         index = i;
//       }
//     }
//
//     if (projectId > 0) {
//       callback(projectId, index);
//     } else {
//       console.log('Project "' + answer + '" does not exists.');
//       this.askProject(project, callback);
//     }
//   }, null, null, project);
// };
// const askSubTask = (subtask, callback) => {
//   ask('Type the parent task key (only the numbers) if exists, otherwise press enter: ', function(answer) {
//     if (answer === false || parseInt(answer) > 0) {
//       this.isSubTask = !!answer;
//       callback(answer);
//     } else {
//       console.log('Please, type only the task number (ex: if issue is "XXX-324", type only "324").');
//       askSubTask(subtask, callback);
//     }
//   }, true, null, subtask);
// };
// const askIssueType = (type, callback) => {
//   const issueTypeArray = project.issuetypes;
//   ask('Select issue type: ', function(issueType) {
//     callback(issueType);
//   }, false, issueTypeArray, type);
// };
// const askIssuePriorities = (priority, callback) => {
//   const issuePriorities = priorities;
//   ask('Select the priority: ', function(issuePriority) {
//     callback(issuePriority);
//   }, false, issuePriorities, priority);
// };
// const newIssue = (projIssue, options) => {
//   let project = typeof projIssue === 'string' ? projIssue : undefined;
//   let parent = undefined;
//
//   if (project !== undefined) {
//     const split = project.split('-');
//     project = split[0];
//
//     if (split.length > 1) {
//       parent = split[1];
//       console.log('Creating subtask for issue ' + projIssue);
//     } else {
//       console.log('Creating issue in project ' + project);
//     }
//   }
//   getMeta(function(error, meta) {
//     if (error) {
//       printError(error.messages);
//       process.stdin.destroy();
//       return;
//     }
//     this.projects = meta;
//     askProject(options.project, function(projectId, index) {
//       this.project = this.projects[index];
//       this.answers.fields.project = {
//         id: projectId
//       };
//
//       if (!options.subtask && (options.priority || options.type || options.summary || options.details)) {
//         options.subtask = false;
//       }
//
//       this.askSubTask(options.subtask, function(taskKey) {
//         if (taskKey) {
//           this.answers.fields.parent = {
//             key: this.project.key + '-' + taskKey
//           };
//         }
//
//         askIssueType(options.type, function(issueTypeId) {
//           answers.fields.issuetype = {
//             id: issueTypeId
//           };
//           ask('Type the issue summary: ', function(issueSummary) {
//             answers.fields.summary = issueSummary;
//             ask('Type the issue details: ', function(issueDescription) {
//               const defaultAnswer = issueSummary;
//
//               if (!issueDescription) {
//                 this.answer.fields.details = defaultAnswer;
//               } else {
//                 answers.fields.details = issueDescription;
//               }
//
//               process.stdin.destroy();
//               this.saveIssue(options);
//             }, null, null, options.details);
//           }, null, null, options.summary);
//         });
//       });
//     });
//   });
// };
// const getMeta = callback => {
//   _jira.issue.getCreateMetadata({})
//     .then(data => {
//       callback(undefined, data.projects);
//     }, response => {
//       callback({ messages: utils.extractErrorMessages(response) }, undefined);
//     });
// };
//
// const saveIssue = () => {
//   _jira.issue.createIssue(answers)
//     .then(data => {
//       console.log(`Issue ${data.key} created successfully!`);
//     }, response => {
//       const errorMessages = utils.extractErrorMessages(response);
//       printError(errorMessages);
//     });
// };
//

// const Create = (jira: JiraClient) => {
//   function printError(messages) {
//     console.log(messages.join('\n'));
//   }
//
//   const create = {
//     query: null,
//     table: null,
//     isSubTask: false,
//     properties: [],
//     projects: [],
//     priorities: [],
//     answers: {
//       fields: {}
//     },
//     ask(question, callback, yesno, values, answer) {
//
//       const options = {},
//         issueTypes = [];
//
//       if (answer || answer === false) {
//         return callback(answer);
//       }
//
//       if (values && values.length > 0) {
//         for (let i = 0; i < values.length; i++) {
//           if (this.isSubTask) {
//             if (values[i].subtask !== undefined) {
//               if (values[i].subtask) {
//                 issueTypes.push('(' + values[i].id + ') ' + values[i].name);
//               }
//             } else {
//               issueTypes.push('(' + values[i].id + ') ' + values[i].name);
//             }
//           } else {
//             if (!values[i].subtask) {
//               issueTypes.push('(' + values[i].id + ') ' + values[i].name);
//             }
//           }
//         }
//
//         console.log(issueTypes.join('\n'));
//       }
//
//       prompt({ message: question }).then(function(answer) {
//         if ((answer as string).length > 0) {
//           callback(answer);
//         } else {
//           if (yesno) {
//             callback(false);
//           } else {
//             this.ask(question, callback);
//           }
//         }
//       });
//     },
//     askProject: function(project, callback) {
//       this.ask('Type the project name or key: ', function(answer) {
//         let projectId = 0,
//           index = 0;
//         answer = answer.charAt(0).toUpperCase() + answer.substring(1).toLowerCase();
//
//         for (let i; i < this.projects.length; i++) {
//           if (answer === this.projects[i].key || answer.toUpperCase() === this.projects[i].key) {
//             projectId = this.projects[i].id;
//             index = i;
//           } else if (answer === this.projects[i].name) {
//             projectId = this.projects[i].id;
//             index = i;
//           }
//         }
//
//         if (projectId > 0) {
//           callback(projectId, index);
//         } else {
//           console.log('Project "' + answer + '" does not exists.');
//           this.askProject(project, callback);
//         }
//       }, null, null, project);
//     },
//     askSubTask: function(subtask, callback) {
//       this.ask('Type the parent task key (only the numbers) if exists, otherwise press enter: ', function(answer) {
//         if (answer === false || parseInt(answer) > 0) {
//           this.isSubTask = answer ? true : false;
//           callback(answer);
//         } else {
//           console.log('Please, type only the task number (ex: if issue is "XXX-324", type only "324").');
//           this.askSubTask(subtask, callback);
//         }
//       }, true, null, subtask);
//     },
//     askIssueType: function(type, callback) {
//       const issueTypeArray = this.project.issuetypes;
//       this.ask('Select issue type: ', function(issueType) {
//         callback(issueType);
//       }, false, issueTypeArray, type);
//     },
//     askIssuePriorities: function(priority, callback) {
//       const issuePriorities = this.priorities;
//       this.ask('Select the priority: ', function(issuePriority) {
//         callback(issuePriority);
//       }, false, issuePriorities, priority);
//     },
//     newIssue: function(projIssue, options) {
//       let project = typeof projIssue === 'string' ? projIssue : undefined;
//       let parent = undefined;
//
//       if (project !== undefined) {
//         const split = project.split('-');
//         project = split[0];
//
//         if (split.length > 1) {
//           parent = split[1];
//           console.log('Creating subtask for issue ' + projIssue);
//         } else {
//           console.log('Creating issue in project ' + project);
//         }
//       }
//       this.getMeta(function(error, meta) {
//         if (error) {
//           printError(error.messages);
//           process.stdin.destroy();
//           return;
//         }
//         create.projects = meta;
//         this.askProject(options.project, function(projectId, index) {
//           this.project = this.projects[index];
//           this.answers.fields.project = {
//             id: projectId
//           };
//
//           if (!options.subtask && (options.priority || options.type || options.summary || options.details)) {
//             options.subtask = false;
//           }
//
//           this.askSubTask(options.subtask, function(taskKey) {
//             if (taskKey) {
//               this.answers.fields.parent = {
//                 key: this.project.key + '-' + taskKey
//               };
//             }
//
//             this.askIssueType(options.type, function(issueTypeId) {
//               this.answers.fields.issuetype = {
//                 id: issueTypeId
//               };
//               this.ask('Type the issue summary: ', function(issueSummary) {
//                 this.answers.fields.summary = issueSummary;
//                 this.ask('Type the issue details: ', function(issueDescription) {
//                   const defaultAnswer = issueSummary;
//
//                   if (!issueDescription) {
//                     this.answer.fields.details = defaultAnswer;
//                   } else {
//                     this.answers.fields.details = issueDescription;
//                   }
//
//                   process.stdin.destroy();
//                   this.saveIssue(options);
//                 }, null, null, options.details);
//               }, null, null, options.summary);
//             });
//           });
//         });
//       });
//     },
//     getMeta: function(callback) {
//       jira.issue.getCreateMetadata({})
//         .then(data => {
//           callback(undefined, data.projects);
//         }, response => {
//           callback({ messages: utils.extractErrorMessages(response) }, undefined);
//         });
//     },
//
//     saveIssue: function() {
//       jira.issue.createIssue(this.answers)
//         .then(data => {
//           console.log(`Issue ${data.key} created successfully!`);
//         }, response => {
//           const errorMessages = utils.extractErrorMessages(response);
//           printError(errorMessages);
//         });
//     }
//   };
//   return create;
// };
