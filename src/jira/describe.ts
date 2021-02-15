import sslRequest from '../ssl_request';

import Table from 'cli-table';

import openurl from 'openurl';

import url from 'url';

import config from '../config';
import commander from 'commander';
import { client } from '../helpers/helpers';
import { IssueResponse } from 'jira-connector/types/api';
import * as os from 'os';
import { issuePickerCompletionAsync } from '../helpers/CompletionHelpers';

export const addDescribeCommand = (prog: commander.Command) => {
  prog
    .command('show <issue>')
    .description('Show info about an issue')
    .option('-o, --output <field>', 'Output field content', String)
    .action(async (issue, options) => {
      try {
        const curIssue = await client.issues.getIssue({ issueIdOrKey: issue, fields: ['*all'] });
        displayIssueDetails(curIssue);
      } catch (e) {
        console.error(e);
      }
    }).command('_complete', { hidden: true })
    .action(issuePickerCompletionAsync);
};

const displayIssueDetails = (iss: IssueResponse) => {

  const table = new Table();
  const comments = iss.fields.comment.comments.map(x => {
    return String(x.body.toString() + '--' + x.author.displayName);
  }).join(os.EOL);
  table.push({
    'Issue': iss.key
  }, {
    'Summary': iss.fields.summary
  }, {
    'Type': iss.fields.issuetype.name
  }, {
    'Priority': iss.fields.priority.name
  }, {
    'Status': iss.fields.status.name
  }, {
    'Reporter': iss.fields.reporter.displayName + ' <' + iss.fields.reporter.emailAddress + '> '
  }, {
    'Assignee': (iss.fields.assignee ? iss.fields.assignee.displayName : 'Not Assigned') + ' <' + (iss.fields.assignee ? iss.fields.assignee.emailAddress : '') + '> '
  }, {
    'Labels': iss.fields.labels ? iss.fields.labels.join(', ') : ''
  }, {
    'Subtasks': iss.fields.subtasks.length
  });
  console.log(table.toString());
  console.log(iss.fields.description ?? 'No Description');
  const width = process.stdout.getWindowSize();
  const a = new Array(width[0] - 20).fill('-', 0).join('');
  console.log(a);
  console.log(iss.fields.comment.comments.map(x => {
    return String('---------------------' + os.EOL + x.updated.toString() + os.EOL + x.body.toString() + os.EOL + '  ' + x.author.displayName);
  }).join(os.EOL));
};

export default (() => {
  const describe = {
    query: null,
    priority: null,
    table: null,
    getIssueField: function(field) {
      sslRequest.get(config.auth.url + this.query + '?fields=' + field ?? '*all').end((err, res) => {
        if (!res.ok) {
          return console.log(res);
        }

        if (res.body.fields) {
          if (typeof res.body.fields[field] === 'string') {
            console.log(res.body.fields[field]);
          } else {
            console.log(res.body.fields[field].name);
          }
        } else {
          console.log('Field does not exist.');
        }
      });
    },
    getIssue: function() {
      sslRequest.get(config.auth.url + this.query).end((err, res) => {
        if (!res.ok) {
          //return console.log(res.body.errorMessages.join('\n'));
          return console.log(res);
        }

        this.table = new Table();
        this.priority = res.body.fields.priority;
        this.description = res.body.fields.description;

        if (!this.priority) {
          this.priority = {
            name: ''
          };
        }

        if (!this.description) {
          this.description = 'No details';
        }

        this.table.push({
          'Issue': res.body.key
        }, {
          'Summary': res.body.fields.summary
        }, {
          'Type': res.body.fields.issuetype.name
        }, {
          'Priority': this.priority.name
        }, {
          'Status': res.body.fields.status.name
        }, {
          'Reporter': res.body.fields.reporter.displayName + ' <' + res.body.fields.reporter.emailAddress + '> '
        }, {
          'Assignee': (res.body.fields.assignee ? res.body.fields.assignee.displayName : 'Not Assigned') + ' <' + (res.body.fields.assignee ? res.body.fields.assignee.emailAddress : '') + '> '
        }, {
          'Labels': res.body.fields.labels ? res.body.fields.labels.join(', ') : ''
        }, {
          'Subtasks': res.body.fields.subtasks.length
        }, {
          'Comments': res.body.fields.comment.total
        });
        console.log(this.table.toString());
        console.log('\r\n' + this.description + '\r\n');
      });
    },
    open: function(issue) {
      openurl.open(url.resolve(config.auth.url, 'browse/' + issue));
    },
    show: function(issue, field = undefined) {
      this.query = 'rest/api/latest/issue/' + issue;

      if (field) {
        return this.getIssueField(field);
      } else {
        return this.getIssue();
      }
    }
  };
  return describe;
})();
