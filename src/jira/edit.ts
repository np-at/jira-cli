/* eslint-disable max-depth */
/*global requirejs,console,define,fs*/

import sslRequest from '../ssl_request';

import config from '../config';

import { ask } from '../common';

import inquirer from 'inquirer';

const prompt = inquirer.createPromptModule();
export default (() => {
  const editMeta = {
    ask: function(question: any, callback: (arg) => void, yesno?: any, values?: any[], answer?: boolean) {
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
          } else if (!values[i].subtask) {
            issueTypes.push('(' + values[i].id + ') ' + (values[i].name ? values[i].name : values[i].value));
          }
        }

        console.log(issueTypes.join('\n'));
      }

      let match;
      prompt({ message: question }).then((answer) =>{
        debugger;

        if ((answer as string).length > 0) {
          values && values.forEach(function(eachValue) {
            if (eachValue.id === answer || eachValue.value === answer || eachValue.name === answer) {
              answer = eachValue.value;
              match = true;
            }
          });

          if (values) {
            if (match) {
              return callback(answer);
            } else {
              editMeta.ask(question, callback, yesno, values);
            }
          } else {
            return callback(answer);
          }
        } else {
          if (yesno) {
            callback(false);
          } else {
            editMeta.ask(question, callback);
          }
        }
      });
    },
    getMeta(issue, callback) {
      this.query = 'rest/api/2/issue/' + issue + '/editmeta';
      sslRequest.get(config.auth.url + this.query).end((err, res) => {
        if (!res.ok) {
          console.log((res.body.errorMessages || [res.error]).join('\n'));
          return callback((res.body.errorMessages || [res.error]).join('\n'));
        }

        callback(null, res.body.fields);
      });
    },
    getOutputFormat(meta: { [x: string]: any; }, issue: any, field: string | number, value: { toString: () => string; }, putBody, cb?: { (arg0: Error, arg1?: undefined): any; (err: any, result: any): any; }) {
      //handling without callback scenarios
      if (!cb) {
        cb = function(err, result) {
          if (err) {
            throw err;
          } else {
            return result;
          }
        };
      }

      const editing = meta[field];

      if (!editing || !editing.schema) {
        return cb(new Error('wrong meta'));
      }

      if (!putBody.fields) {
        putBody.fields = {};
      }

      let formattedValue;

      if (editing.schema.type === 'string') {
        formattedValue = value.toString();
      } else if (editing.schema.type === 'array') {
        //how to give multiple inputs
        if (editing.schema.items === 'string') {
          formattedValue = value.toString().split(',');
        }
      } else if (editing.schema.type === 'any') {
        console.log('not yet supported');
      } else if (editing.schema.type === 'priority') {
        formattedValue = {
          id: value
        };
      }

      if (!formattedValue) {
        return cb(new Error('this type of field is not supported yet'));
      }

      putBody.fields[field] = formattedValue;
      return cb(null, putBody);
    },
    makeEditCall(issue, putbody, cb) {
      this.query = 'rest/api/2/issue/' + issue;
      sslRequest.put(config.auth.url + this.query).send(putbody).end((err, res) => {
        if (!res.ok) {
          console.log(res);

          if (res.body && res.body.errorMessages) {
            console.log(res.body && res.body.errorMessages && res.body.errorMessages.join('\n'));
            return cb(res.body.errorMessages.join('\n'));
          }

          return cb(new Error('some error'));
        }

        console.log('Issue edited successfully!');
        return cb();
      });
    },
    editWithInputPutBody(issue, input, cb) {
      editMeta.getMeta(issue, function(err, meta) {
        if (err) {
          return cb(err);
        }

        let putBody: Record<string, unknown> = {};

        if (config && config.edit_meta && config.edit_meta['__default'] && config.edit_meta['__default'][input]) {
          putBody = config.edit_meta['__default'][input];
        } else {
          const parsedInputMap = editMeta.parseEditInput(input);
          Object.keys(parsedInputMap).forEach(function(eachField) {
            putBody = editMeta.getOutputFormat(meta, issue, eachField, parsedInputMap[eachField], putBody);
          });
        }

        editMeta.makeEditCall(issue, putBody, cb);
      });
    },
    parseEditInput(input) {
      const inputArr = input.toString().split(';;');
      let singleInput, inputKey, inputValue, finalKey, finalValue;
      const inputObj = {};
      inputArr.forEach(function(eachInput) {
        singleInput = eachInput.split('::');
        inputKey = singleInput[0];
        inputValue = singleInput[1];

        if (config && config.edit_meta && config.edit_meta[inputKey]) {
          if (config.edit_meta[inputKey].key) {
            finalKey = config.edit_meta[inputKey].key;
          }

          if (config.edit_meta[inputKey].default && config.edit_meta[inputKey].default[inputValue]) {
            finalValue = config.edit_meta[inputKey].default[inputValue];
          }
        } else {
          finalKey = inputKey;
          finalValue = inputValue;
        }

        inputObj[finalKey] = finalValue;
      });
      return inputObj;
    },
    edit(issue, cb) {
      editMeta.getMeta(issue, function(err, meta) {
        if (err) {
          return cb(err);
        }

        const metaInput = [];
        Object.keys(meta).forEach(function(eachMeta, index) {
          metaInput.push({
            id: index,
            value: eachMeta,
            name: meta[eachMeta].name
          });
        });
        editMeta.ask('enter Input ', (answer?: any) => {
          console.log(answer);
          let inputOptions;

          if (meta[answer] && meta[answer].allowedValues && meta[answer].allowedValues.length) {
            inputOptions = meta[answer].allowedValues;
          }

          ask('Enter value ', function(answerValue) {
            const putBody: Record<string, any> = {};
            editMeta.getOutputFormat(meta, issue, answer, answerValue, putBody, function(err, putBody) {
              if (err) {
                return cb(err);
              }

              editMeta.makeEditCall(issue, putBody, cb);
            });
          }, null, inputOptions);
        }, null, metaInput);
      });
    }
  };
  return editMeta;
})();
