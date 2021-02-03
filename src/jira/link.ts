/* eslint-disable max-depth */
import sslRequest from "../ssl_request";

import config from "../config";
import inquirer from "inquirer";

const prompt = inquirer.createPromptModule();
export default (() => {
  function ask(question, callback, yesno, values, options) {
    options = options || {};
    const issueTypes = [];
    let i = 0; //from command if provided

    if (options.link_value) {
      return callback(options.link_value);
    }

    if (values && values.length > 0) {
      for (i; i < values.length; i++) {
        if (this.isSubTask) {
          if (values[i].subtask !== undefined) {
            if (values[i].subtask) {
              issueTypes.push('(' + values[i].id + ') ' + options.from + ' ' + values[i].outward + ' ' + options.to);
            }
          } else {
            issueTypes.push('(' + values[i].id + ') ' + options.from + ' ' + values[i].outward + ' ' + options.to);
          }
        } else {
          if (!values[i].subtask) {
            issueTypes.push('(' + values[i].id + ') ' + options.from + ' ' + values[i].outward + ' ' + options.to);
          }
        }
      }

      console.log(issueTypes.join('\n'));
    }
    prompt({message: question}).then(function(answer) {
      if ((answer as string).length > 0) {
        callback(answer);
      } else {
        if (yesno) {
          callback(false);
        } else {
          this.ask(question, callback);
        }
      }
    }, options);
  }

  function askLinkType(options, cb) {
    getLinkType(function(linkTypes) {
      ask('Select the linktype: ', function(link) {
        cb(link);
      }, false, linkTypes, options);
    });
  }

  function getLinkType(cb) {
    this.query = 'rest/api/2/issueLinkType';
    sslRequest.get(config.auth.url + this.query).end((err, res) => {
      if (!res.ok) {
        return console.log(res.body.errorMessages.join('\n'));
      }

      return console.log(res.body.issueLinkTypes);
    });
  }

  function callLink(reqOpts, cb) {
    this.query = 'rest/api/2/issueLink';
    sslRequest.post(config.auth.url + this.query).send(reqOpts).end((err, res) => {
      if (!res.ok) {
        return console.log(res.body.errorMessages.join('\n'));
      }

      console.log('Issues linked');
      return cb();
    });
  }

  return function link(from, to, link_value, options, cb) {
    const reqOpts = {
      'type': {
        'name': 'Relate',
        id: undefined
      },
      'inwardIssue': {
        'key': from
      },
      'outwardIssue': {
        'key': to
      },
      'comment': {
        'body': 'Linked related issue!'
      }
    };
    options.from = from;
    options.to = to;
    options.link_value = link_value;
    askLinkType(options, function(linkname) {
      reqOpts.type.id = linkname;
      callLink(reqOpts, cb);
    });
  };
})();
