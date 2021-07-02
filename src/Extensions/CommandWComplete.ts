import commander from 'commander';
import { CursorPos } from 'readline';

import * as os from 'os';

export const completionSeparator = '|*|';

interface retob {
  name?: string,
  description?: string,
  options?: treeOption[],
  subcommands?: retob[]
}

export class RetobImpl implements retob {
  description: string;
  name: string;
  options: treeOption[];
  subcommands: RetobImpl[];
  jql_query?: string;

  match = (prop: string) => {
    if (prop.startsWith('-')) {
      return this.options.filter(x => (x.short.normalize().startsWith(prop.normalize()))).map(x => ({
        name: x.short,
        type: 'option',
        description: x.description
      }));
    }
    return this.subcommands.filter(x => x.name.normalize().startsWith(prop.normalize())).map(x => ({
      name: x.name,
      type: 'command',
      description: x.description,
      ref: x
    }));
  };
}

interface treeOption {
  name: string,
  short?: string,
  long?: string,
  description?: string
}

const genNode = (cmd: commander.Command): RetobImpl => {
  const help: commander.Help = cmd.createHelp();
  const o: RetobImpl = new RetobImpl();
  o.description = cmd.description();
  o.name = cmd.name();
  o.options = help.visibleOptions(cmd).map<treeOption>(x => ({
    name: x.name(),
    short: x.short,
    long: x.long,
    description: x.description,
    valueReq: x.required
  }));
  o.subcommands = help.visibleCommands(cmd).map(x => genNode(x));
  if (!o.subcommands || o.subcommands?.length <= 0) {
    o.jql_query = null;
  }
  return o;
};

export class CommandWComplete extends commander.Command {
  addCompletion = (cb?: (cursorPos: CursorPos, commandAST?: string, wordToComplete?: string) => string[] | Promise<string[]>) => {
    this.command('_complete [cursorPosition] [commandAST] [wordToComplete]', { hidden: true }).action((...args) => {
      try {
        const callback = cb || this.defaultCompleter;
        Promise.resolve(callback(args[0], args[1], args[2])).then(value => console.log(value?.join(os.EOL))).catch(error => console.error(error));
      } catch (e) {
        console.error(e);
      }
    });
    return this;
  };

  createCommand(name: string, completionCB?): CommandWComplete {
    return new CommandWComplete(name);
  }

  genTree = (): RetobImpl => genNode(this);


  defaultCompleter = (cursorPos: number, commandAST?: string, wordToComplete?: string) => {
    const ast = this.genTree();
    const args = commandAST?.split(' ') ?? [];
    let currentNode = ast;
    if (args.length === 0)
      return ast.subcommands.map(x => `${x.name}${completionSeparator}${x.description}`).concat(ast.options.map(x => `${x.long}${completionSeparator}${x.description}`));
    for (let i = 0; i < args.length; i++) {
      if (i === args.length - 1) {
        if (isCursorExtended(commandAST, cursorPos) || args[i].trim() === '')
          return currentNode.subcommands.map(x => `${x.name}${completionSeparator}${x.description}`).concat(currentNode.options.map(x => `${x.long}${completionSeparator}${x.description}`));

      }

      // if current arg should be ahead of ast by 1 ; if they're the same, let current arg skip ahead by one
      if (ast.name.normalize() === args[i].normalize() || args[i].normalize() === 'jira'.normalize())
        continue;
      const m = currentNode.match(args[i]);
      // console.log(m);
      if (m.length === 0)
        return currentNode.subcommands.map(x => `${x.name}${completionSeparator}${x.description}`).concat(currentNode.options.map(x => `${x.long}${completionSeparator}${x.description}`));
      if (m.length === 1) {

        if (m[0].hasOwnProperty('ref')) {
          if (i === args.length - 1 && !isCursorExtended(commandAST, cursorPos)) {
            return m.map(x => `${x.name}${completionSeparator}`);
          }
          currentNode = m[0]['ref'] as RetobImpl;
          continue;
        }

        // else {
        //   return currentNode.subcommands.map(x=>`${x.name}${completionSeparator}`).concat(currentNode.options.map(x=>`${x.long}${completionSeparator}`));
        // }
      }
      return m.map(x => {
        return `${x.name}${completionSeparator}`;
      });

    }
  };
}

const isCursorExtended = (input: string, cursorPos: number) => (cursorPos >= input.trimEnd().length);
