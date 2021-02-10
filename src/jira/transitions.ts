/* eslint-disable brace-style,max-depth */
import sslRequest from '../ssl_request';

import Table from 'cli-table';

import config from '../config';
import inquirer_autocomplete_prompt from 'inquirer-autocomplete-prompt';

import inquirer from 'inquirer';
import commander from 'commander';


const prompt = inquirer.createPromptModule().registerPrompt('autocomplete', inquirer_autocomplete_prompt);

export const registerTransitionCommand = (prog: commander.Command) => {
  prog.command('t [issue] [transition_state]');

};

export default function transitions(): { getTransitions: (issue, cb) => void; transitionID: null; query: null; start: (issue, cb) => void; transitions: null; done: (issue, resolution, cb) => void; stop: (issue, cb) => void; review: (issue, cb) => void; ask(question, callback, yesno, values, answer?: unknown): any; invalid: (issue, resolution, cb) => void; getTransitionCode: (issue, transitionName, cb) => void; getResolutionCode: (resolutionName, callback) => void; doTransition: (issue, transitionID, resolutionID, cb?: any) => void; makeTransition: (issue, cb) => void } {
  const transitions = {
    query: null,
    transitions: null,
    transitionID: null,
    ask(question, callback, yesno, values, answer?: unknown) {
      const options = {},
        issueTypes = [];
      let i = 0;

      if (answer || answer === false) {
        return callback(answer);
      }

      if (values && values.length > 0) {
        for (i; i < values.length; i++) {
          if (this.isSubTask) {
            if (values[i].subtask !== undefined) {
              if (values[i].subtask) {
                issueTypes.push('(' + values[i].id + ') ' + (values[i].name ? values[i].name : values[i].value));
              }
            } else {
              issueTypes.push('(' + values[i].id + ') ' + (values[i].name ? values[i].name : values[i].value));
            }
          } else {
            if (!values[i].subtask) {
              issueTypes.push('(' + values[i].id + ') ' + (values[i].name ? values[i].name : values[i].value));
            }
          }
        }

        console.log(issueTypes.join('\n'));
      }

      const valueArray = values.map(function(value) {
        return value.id;
      });
      prompt({ message: question }).then(function(answer) {
        if ((answer as string).length > 0) {
          if (valueArray.indexOf(answer) >= 0) {
            callback(answer);
          } else {
            this.ask(question, callback, yesno, values);
          }
        } else {
          if (yesno) {
            callback(false);
          } else {
            this.ask(question, callback);
          }
        }
      });
    },
    doTransition: function(issue, transitionID, resolutionID, cb?: any) {

      if (typeof resolutionID === 'function') {
        cb = resolutionID;
        resolutionID = null;
      }

      this.query = 'rest/api/2/issue/' + issue + '/transitions';
      const requestBody: { transition: { id: any }, fields?: unknown } = {
        transition: {
          id: transitionID
        }
      };

      if (resolutionID && config.options['jira_done']['check_resolution']) {
        requestBody.fields = {
          resolution: {
            id: resolutionID
          }
        };
      }

      sslRequest.post(config.auth.url + this.query).send(requestBody).end((err, res) => {
        if (!res.ok) {
          cb((res.body.errorMessages || [res.error]).join('\n'));
        }

        if (cb) {
          cb();
        }
      });
    },
    getTransitions: function(issue, cb) {
      this.query = 'rest/api/2/issue/' + issue + '/transitions';
      sslRequest.get(config.auth.url + this.query).end((err, res) => {
        if (!res.ok) {
          debugger;
          return cb(new Error(res.body.errorMessages.join('\n')));
        }

        const transitions = res.body.transitions || [];
        return cb(null, transitions);
      });
    },
    makeTransition: function(issue, cb) {
      transitions.getTransitions(issue, function(err, transitionsAvailable) {
        if (err) {
          return cb(err);
        }

        transitions.ask('Enter transition ', answer => {
          transitions.doTransition(issue, answer, err => {
            if (err) {
              return cb(err);
            }

            console.log('marked issue with transition ' + answer);
            return cb();
          });
        }, null, transitionsAvailable);
      });
    },
    getTransitionCode: function(issue, transitionName, cb) {
      transitions.getTransitions(issue, function(err, allTransitions) {
        if (err) {
          return cb(err);
        }

        allTransitions.some(function(transition) {
          if (transition.name === transitionName) {
            this.transitionID = transition.id;
          } else if (transition.to.name === transitionName) {
            this.transitionID = transition.id;
          }
        });

        if (!this.transitionID) {
          console.log('Issue already ' + transitionName + ' or bad transition.');

          if (allTransitions) {
            console.log('Available Transitions');
            const table = new Table({
              head: ['Key', 'Name']
            });
            allTransitions.forEach(function(item) {
              table.push([item.id, item.name]);
            });
            console.log(table.toString());
          }

          return;
        } else {
          cb(this.transitionID);
        }
      });
    },
    getResolutionCode: function(resolutionName, callback) {
      const i = 0;
      this.query = 'rest/api/2/resolution';
      sslRequest.get(config.auth.url + this.query).end((err, res) => {
        if (!res.ok) {
          return console.log(res.body.errorMessages.join('\n'));
        }

        const resolutions = res.body;
        let resolutionData; // when a specific resolution is informed by command line.

        if (resolutionName && resolutionName !== '') {
          resolutions.forEach(function(resolution) {
            if (resolution.name === resolutionName) {
              resolutionData = resolution;
            }
          });
        } // default is always first
        else if (!resolutionName && resolutions.length > 0) {
          resolutionData = resolutions[0];
        }

        if (resolutionData) {
          return callback(resolutionData.id);
        } else {
          console.log('Resolution Not Found!\n');
          console.log('Available Resolutions');
          const table = new Table({
            head: ['Key', 'Name', 'Description']
          });
          resolutions.forEach(function(item) {
            table.push([item.id, item.name, item.description]);
          });
          console.log(table.toString());
          console.log('You can change this behaviour by editing ~/.jira/config.json');
          return;
        }
      });
    },
    start: function(issue, cb) {
      this.transitionName = config.options['jira_start']['status'];
      this.getTransitionCode(issue, this.transitionName, function(transitionID) {
        this.doTransition(issue, transitionID, function(err) {
          console.log('Issue [' + issue + '] moved to ' + this.transitionName);
          cb(err);
        });
      });
    },
    stop: function(issue, cb) {
      this.transitionName = config.options['jira_stop']['status'];
      this.getTransitionCode(issue, this.transitionName, function(transitionID) {
        this.doTransition(issue, transitionID, function(err) {
          console.log('Issue [' + issue + '] moved to ' + this.transitionName);
          cb(err);
        });
      });
    },
    review: function(issue, cb) {
      this.transitionName = config.options['jira_review']['status'];
      this.getTransitionCode(issue, this.transitionName, function(transitionID) {
        this.doTransition(issue, transitionID, function(err) {
          console.log('Issue [' + issue + '] moved to ' + this.transitionName);
          cb(err);
        });
      });
    },
    done: function(issue, resolution, cb) {

      this.transitionName = config.options['jira_done']['status'];
      this.resolutionName = resolution;
      this.getResolutionCode(this.resolutionName, function(resolutionID) {
        this.getTransitionCode(issue, this.transitionName, function(transitionID) {
          this.doTransition(issue, transitionID, resolutionID, function(err) {
            console.log('Issue [' + issue + '] moved to ' + this.transitionName);
            cb(err);
          });
        });
      });
    },
    invalid: function(issue, resolution, cb) {

      this.transitionName = config.options['jira_invalid']['status'];
      this.resolutionName = resolution;
      this.getResolutionCode(this.resolutionName, function(resolutionID) {
        this.getTransitionCode(issue, this.transitionName, function(transitionID) {
          this.doTransition(issue, transitionID, resolutionID, function(err) {
            console.log('Issue [' + issue + '] moved to ' + this.transitionName);
            cb(err);
          });
        });
      });
    }
  };
  return transitions;
}
