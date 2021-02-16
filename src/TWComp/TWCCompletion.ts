// Load in dependencies
import Completion from './completion';
import commander from 'commander';
// Define a prototype for the would-be class
// DEV: We don't create a sub-class because `Command.command()` doesn't return an instance of `this`
export class CompletableP extends commander.Command {
  private _completion: any;
  constructor(...args) {
    super(...args);
  }
  // Save a completion command for the current command
  completion(_completion) {
    this._completion = _completion;
    return this;
  }
  // Create method to invoke completion for this command
  complete(params: {line: string, cursor: number}, cb) {
    // TODO: We should fallback to environment variables (e.g. COMP_CWORD)
    // TODO: If we are invoked sans params. slice off the first 2 parameters of `line` (e.g. `node /usr/bin/abc`)
    // Fallback cb
    cb = cb || function (err, results) {
      // If there was an error, throw it
      if (err) {
        throw err;
      }

      // Otherwise, log each result
      results.forEach(function (result) {
        console.log(result);
      });
    };

    // Generate a new Completion based off of this command
    function getCompletionTree(node: CompletableP) {
      // By default, look for completion logic
      // DEV: This is defined by running the `completion` command on a command
      // which then saves the logic to the command itself
      const nodeName = node.name();
      const retVal = {
        // TODO: We need to be able to require `name` for programs
        name: nodeName,
        completion: undefined,
        commands: undefined,
        options: undefined
      };

      // If there is completion logic, save it
      if (node._completion) {
        retVal.completion = node._completion;
        // Otherwise
      } else {
        // Recurse each of the commands as a child
        retVal.commands = node.commands.map(function addCommand (command: CompletableP) {
          // Add the command to our list
          return getCompletionTree(command);
        });
      }

      // If there are any options on that command, add those as viable venues
      retVal.options = [];
      // @ts-ignore
      node.options?.forEach(function addCommandOption (option) {
        // Define common option handler
        function completeOption(info, cb) {
          // If the option is required, shift the next word
          if (option.required) {
            info = this.shiftLeftWord(info);
          }

          // If the option is optional
          if (option.optional) {
            // If the next word is not an option, then use it (e.g. does not start with `-`)
            const leftmostWord = info.words.remainingLeft[0];
            if (leftmostWord && leftmostWord[0] !== '-') {
              info = this.shiftLeftWord(info);
            }
          }

          // Keep on recursing
          this.resolveInfo(info, cb);
        }

        // If there is a short key, use it (e.g. `-n`)
        if (option.short) {
          retVal.options.push({
            name: option.short,
            completion: completeOption
          });
        }

        // If there is a long key, use it (e.g. `--dry-run`)
        if (option.long) {
          retVal.options.push({
            name: option.long,
            completion: completeOption
          });
        }
      });

      // Return our retVal
      return retVal;
    }
    const tree = getCompletionTree(this);
    const completion = new Completion(tree);

    // If the program does not have a name, callback with an error
    if (completion.name) {
      const err = new Error('`commander-completion` requires `program.name` to be defined in order to operate');
      return process.nextTick(function () {
        cb(err);
      });
    }
    // Parse the arguments
    completion.complete(params, cb);
  }
}

export const CompletableProto = {
  // Save a completion command for the current command
  completion: function (_completion) {
    this._completion = _completion;
    return this;
  },
  // Create method to invoke completion for this command
  complete: function (params, cb) {
    // TODO: We should fallback to environment variables (e.g. COMP_CWORD)
    // TODO: If we are invoked sans params. slice off the first 2 parameters of `line` (e.g. `node /usr/bin/abc`)
    // Fallback cb
    cb = cb || function (err, results) {
      // If there was an error, throw it
      if (err) {
        throw err;
      }

      // Otherwise, log each result
      results.forEach(function (result) {
        console.log(result);
      });
    };

    // Generate a new Completion based off of this command
    function getCompletionTree(node) {
      // By default, look for completion logic
      // DEV: This is defined by running the `completion` command on a command
      // which then saves the logic to the command itself
      let nodeName = node.name;
      if (nodeName) {
        // `name` for programs (string on older versions of Commander, function on newer)
        if (typeof nodeName === 'function') {
          nodeName = node.name();
        }
      } else {
        // `_name` for commands
        nodeName = node._name;
      }
      const retVal = {
        // TODO: We need to be able to require `name` for programs
        name: nodeName,
        completion: undefined,
        commands: undefined,
        options: undefined
      };

      // If there is completion logic, save it
      if (node._completion) {
        retVal.completion = node._completion;
        // Otherwise
      } else {
        // Recurse each of the commands as a child
        retVal.commands = node.commands.map(function addCommand (command) {
          // Add the command to our list
          return getCompletionTree(command);
        });
      }

      // If there are any options on that command, add those as viable venues
      retVal.options = [];
      node.options.forEach(function addCommandOption (option) {
        // Define common option handler
        function completeOption(info, cb) {
          // If the option is required, shift the next word
          if (option.required) {
            info = this.shiftLeftWord(info);
          }

          // If the option is optional
          if (option.optional) {
            // If the next word is not an option, then use it (e.g. does not start with `-`)
            const leftmostWord = info.words.remainingLeft[0];
            if (leftmostWord && leftmostWord[0] !== '-') {
              info = this.shiftLeftWord(info);
            }
          }

          // Keep on recursing
          this.resolveInfo(info, cb);
        }

        // If there is a short key, use it (e.g. `-n`)
        if (option.short) {
          retVal.options.push({
            name: option.short,
            completion: completeOption
          });
        }

        // If there is a long key, use it (e.g. `--dry-run`)
        if (option.long) {
          retVal.options.push({
            name: option.long,
            completion: completeOption
          });
        }
      });

      // Return our retVal
      return retVal;
    }
    const tree = getCompletionTree(this);
    const completion = new Completion(tree);

    // If the program does not have a name, callback with an error
    if (completion.name) {
      const err = new Error('`commander-completion` requires `program.name` to be defined in order to operate');
      return process.nextTick(function () {
        cb(err);
      });
    }
    // Parse the arguments
    completion.complete(params, cb);
  }
};

// Define and bind a mixin method
function mixinCommandPrototype(commandPrototype) {
  Object.getOwnPropertyNames(CompletableProto).forEach(function (key) {
    commandPrototype[key] = CompletableProto[key];
  });
  return commandPrototype;
}

export default function mixinCommanderCompletion(commander) {
  mixinCommandPrototype(commander.command.prototype);
  return commander;
}
export { mixinCommandPrototype };
