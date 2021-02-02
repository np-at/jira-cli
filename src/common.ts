import program from 'commander';
import {options as defaultOptions} from './initial_config';

export function ask(question: never, callback: never, yesno: boolean | undefined = undefined, values: [] = [], answer: never | undefined  = undefined): void {

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

  program.prompt(question, function (answer) {
    if (answer.length > 0) {
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
