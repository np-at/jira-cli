import sslRequest from '../ssl_request';

import Table from 'cli-table';

import openurl from 'openurl';

import url from 'url';

import config from '../config';

export default (() => {
  const describe = {
    query: null,
    priority: null,
    table: null,
    getIssueField: function(field) {
      sslRequest.get(config.auth.url + this.query + '?fields=' + field).end((err, res) => {
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
          this.description = 'No description';
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
