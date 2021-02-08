/* eslint-disable max-depth */
import { options as defaultOptions } from './initial_config';

import inquirer from 'inquirer';

const prompt = inquirer.createPromptModule();

export function ask(question: string, callback, yesno: boolean | undefined = undefined, values: Record<string, unknown>[] = [], answer: never | undefined = undefined): void {

  const options = defaultOptions || {},
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
