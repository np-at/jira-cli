//https://jira.mypaytm.com/rest/api/2/issue/MPP-509/editmeta
//https://developer.atlassian.com/jiradev/jira-apis/jira-rest-apis/jira-rest-api-tutorials/jira-rest-api-example-edit-issues

import sslRequest from "../ssl_request";

import config from "../config";

import sprint from "./sprint";

import ls from "./ls";

import async from "async";
import inquirer from "inquirer";

const prompt = inquirer.createPromptModule();
export default (()=> {
  function ask(question, callback, yesno?:boolean, values?: unknown[], options?: Record<string, never>) {
    options = options || {};
    const issueTypes = [];
    let i = 0;

    if (values && values.length > 0) {
      for (i; i < values.length; i++) {
        issueTypes.push('(' + values[i][0] + ') ' + values[i][1]);
      }

      console.log(issueTypes.join('\n'));
    }

    prompt({ message: question }).then(function(answer) {
      if ((answer as string).length > 0) {
        callback(answer);
      } else {
        if (yesno) {
          callback(false);
        } else {
          this.ask(question, callback);
        }
      }
    });
  }

  const addToSprint = {
    addIssuesViaKey: function addIssuesViaKey(options, cb) {
      if (options.rapidboard || options.sprint) {
        sprint(options.rapidboard, options.sprint, function(sprintData) {
          ask('Please enter the sprint', function(sprintId) {
            console.log('here');
            _addToSprint(sprintId, options.add, cb);
          }, false, sprintData);
        });
      } else if (options.jql) {
        addAllJqlToSprint(options.sprintId, options.jql, cb);
      } else if (options.sprintId) {
        _addToSprint(options.sprintId, options.add, cb);
      }
    },
    addAllJqlToSprint: function addAllJqlToSprint(options, cb) {
      if (!options.jql || !options.sprintId) {
        return cb(new Error('jql or sprint id not found'));
      }

      ls.jqlSearch(options.jql, {}, function(err, issues) {
        ask('Are you sure you want to add all above issues in sprint id ' + options.sprintId + ' [y/N]: ', function(answer) {
          if (answer !== 'y') {
            return cb('no issues were added to sprint');
          }

          async.eachSeries(issues, (eachIssue, scb) => {
            _addToSprint(options.sprintId, (eachIssue as Record<string, string>).key, scb);
          }, () => cb());
        }, true);
      });
    }
  };

  function addAllJqlToSprint(sprintId, jql, cb) {
    ls.jqlSearch(jql, {}, function(err, issues) {
      ask('Are you sure you want to add all above issues in sprint id ' + sprintId + ':', function(answer) {
        console.log(answer);
      }, true);
    });
  }

  function _addToSprint(sprintId: any, projIsssue: string, cb) {
    const data = {
      'fields': {}
    };

    if (!config.edit_meta || !config.edit_meta.sprint) {
      return cb('sprint field not found');
    }

    data.fields[config.edit_meta.sprint.name] = config.edit_meta.sprint.type === 'number' ? Number(sprintId) : sprintId;
    sslRequest.put(config.auth.url + '/rest/api/2/issue/' + projIsssue).send(data).end((err, res) => {
      if (!res.ok) {
        console.log('Error getting rapid boards. HTTP Status Code: ' + res.status);
        console.dir(res.body);
        return cb();
      }

      console.log('Added [' + projIsssue + '] to sprint with id ' + sprintId);
      return cb();
    });
  } //exporting from file


  return addToSprint;
})();
