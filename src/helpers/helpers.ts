import { jiraclCreateOptions } from '../entrypoint';
import { Client } from 'jira.js';
import config from '../config';
import inquirer from 'inquirer';
import auth from '../auth';

export const parseProjIssue = (projIssue?: string): { project: string, issueId: string } => {

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
export const promptForProject = ()=> {
  const projects = client;
};
export const getMainTextColWidth = (otherColTotal: number) =>{
  return (process.stdout.columns || 200) - otherColTotal;
};
const _getClient = () => {
  if (config && config?.auth?.url)
    return new Client({
      host: config.auth.url,
      authentication: {
        basic: {
          username: config.auth.user,
          apiToken: Buffer.from(config.auth.token, 'base64').toString('utf-8').split(':', 2)[1]
        }
      },
      baseRequestConfig: {
        withCredentials: true
      }
    });
  else
    auth.setup({});
};
export const client = _getClient();

export const fetchIssues = async (currentOptions: jiraclCreateOptions) => {

  // const client1 = new JiraCon({
  //   host: new URL.URL(config.auth.url).host,
  //   basic_auth: { email: config.auth.user, api_token: config.auth.token }
  //
  // });
  try {
    return await client.issues.getCreateIssueMetadata();

  } catch (e) {
    console.error(e);
  }
};
export const selectProject = async () => {
  const projects = await client.projects.getAllProjects({});
  const asnwer = inquirer.prompt({ name: 'Choose Project', type: 'list', message: 'choose one', choices: projects });
};
