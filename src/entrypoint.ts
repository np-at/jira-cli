/* eslint-disable max-statements */

//
// Main API       : https://docs.atlassian.com/software/jira/docs/api/REST/8.1.0/
// Creating Issues: https://developer.atlassian.com/jiradev/jira-apis/about-the-jira-rest-apis/jira-rest-api-tutorials/jira-rest-api-examples#JIRARESTAPIexamples-Creatinganissueusingcustomfields
// Issue Links    : https://docs.atlassian.com/jira/REST/server/?_ga=2.55654315.1871534859.1501779326-1034760119.1468908320#api/2/issueLink-linkIssues
// Required Fields: https://jira.mypaytm.com/rest/api/2/issue/createmeta?projectKeys=MDO&expand=projects.issuetypes.fields&
// Meta-data      : http://localhost:8080/rest/api/2/issue/JRA-13/editmeta
//

import commander, { Command } from 'commander';
import config from './config';
import auth from './auth';
import ls, { lsCommand } from './jira/ls';
import describe, { addDescribeCommand } from './jira/describe';
import assign from './jira/assign';
import fix from './jira/fix';
import release from './jira/release';
import send from './jira/send';
import comment from './jira/comment';
import sprint from './jira/sprint';
import transitions from './jira/transitions';
import worklog from './jira/worklog';
import link from './jira/link';
import watch from './jira/watch';
import addToSprint from './jira/addToSprint';
import newCreate from './jira/new';
import edit from './jira/edit';
import addJiraCreateCommand from './jira/create';
import * as os from 'os';
import { issuePickerCompletionAsync } from './helpers/CompletionHelpers';

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import pkg from '../package.json';
import CacheObject from './helpers/cache';

export interface jiraclCreateOptions {
  project?: string;
  priority?: string;
  type?: number;
  subtask?: boolean;
  summary?: string;
  description?: string;
  assignee?: string;
  verbose?: boolean;
  issue?: string;
  parent?: string;

}

(async () => {
  function finalCb(err, results?: any) {
    if (err) {
      console.log(...err.toString());
      process.exit(1);
    }
    // console.log(results.toString());
    process.exit(0);
  }


  const program = new Command().enablePositionalOptions(true).storeOptionsAsProperties(false).allowUnknownOption(true).allowExcessArguments(true);
  const cache = new CacheObject();
  program.version(pkg.version);
  lsCommand(program, finalCb);
  program.command('_complete [cursorPos] [commandAst] [wordToComplete]', { hidden: true }).action(async (...args) => {
    const cursorPos = parseInt(args[0]);
    const wordToComplete = args[2];
    const currentInput: string[] = args[1].split(' ');
    const app = currentInput.shift();

    // console.debug(...args);
    const commands = program.commands.map(x => x.name()).filter(x => x !== '_complete');
    if (currentInput.length === 0) { // return all top level commands
      // console.log(program.commands[0].helpInformation());
      console.log(program.commands.filter(x => x.name() !== '_complete').flatMap(x => (`${x.name()}|*|${x.usage()}`)).join(os.EOL)); //.map(x=>(String(`${x.name()}|*|${x.description()}`))).join(os.EOL));
      // console.log(commands.join(os.EOL));
      return;
    } else if (currentInput.length === 1) {
      let lng = app.length;
      for (let i = 0; i < currentInput.length; i++) {
        lng++;
        lng += currentInput[i].length;
      }
      // console.log("length is: ", lng, cursorPos);

      if (lng >= cursorPos) {// if (program.commands.find(x=>x.name().normalize() === currentInput[0]))
        // cursor is still on word
        // console.log('length is: ', lng, cursorPos);
        console.log(commands.filter(x => x.normalize().startsWith(currentInput[0].normalize())).join(os.EOL));
        return;
      }

    }

    // try {
    //   await program.parseAsync(currentInput);
    // } catch (e) {
    //   console.error(e);
    // }
    // return;


    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    let currentCommand: commander.Command = program._findCommand(currentInput[0]);
    for (let i = 1; i <= currentInput.length; i++) {
      if (currentInput[i].startsWith('-')) {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        const options: commander.Option[] = currentCommand.options.filter(x => x.long.startsWith(currentInput[i]));
        console.log(options.map(x => String(x.long + '|*|' + x.description)).join(os.EOL));
        return;
      }
      const nextArg = currentCommand.commands.find(x => x?.name()?.normalize() === currentInput[i]?.normalize());
      if (!nextArg || i >= currentInput.length - 1) {
        try {
          const extraArgs = currentInput.slice(i) ?? [];
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          currentCommand._dispatchSubcommand('_complete', extraArgs, []);
          return;
        } catch (e) {
          console.log(e);
          console.error(e);
        }
      } else {

        currentCommand = nextArg;
      }

    }
    console.log('ERRROR');
    // if (currentCommand) {
    //   try {
    //     // @ts-ignore
    //     currentCommand._dispatchSubcommand('_complete', [], []);
    //
    //     return;
    //   } catch (e) {
    //     console.error(e);
    //   }
    // const currentCompletionCommand = currentCommand._findCommand('_complete');
    // // @ts-ignore
    // if (currentCompletionCommand._executableHandler) {
    //   try {
    //     // @ts-ignore
    //     program._executeSubCommand(currentCompletionCommand, undefined);
    //   } catch (e) {
    //     console.error(e);
    //   }
    // }
    // }


    // console.log(currentInput);
    // let currentCom: commander.Command = program;
    // for (let i = 0; i < currentInput.length - 1; i++) {
    //   const nextCommand = currentCom.commands.find(x => x.name().normalize('NFC') === currentInput[i].normalize('NFC'));
    //   if (nextCommand)
    //     currentCom = nextCommand;
    // }
    // console.log(...currentCom.commands.map(x => x?.name()?.trim()).concat(currentCom?.opts().trim()).join(os.EOL));
  });

  program
    .command('start <issue>')
    .description('Start working on an issue.')
    .action(issue => {
      transitions.start(issue, finalCb);
    }).command('_complete', { hidden: true }).action(issuePickerCompletionAsync);
  program
    .command('stop <issue>')
    .description('Stop working on an issue.')
    .action(issue => {
      transitions.stop(issue, finalCb);
    }).command('_complete', { hidden: true }).action(issuePickerCompletionAsync);
  program
    .command('review <issue> [assignee]')
    .description('Mark issue as being reviewed [by assignee(optional)].')
    .action((issue, assignee) => {
      transitions.review(issue, finalCb);

      if (assignee) {
        assign().to(issue, assignee);
      }
    }).command('_complete', { hidden: true }).action(issuePickerCompletionAsync);
  program
    .command('done <issue>')
    .option('-r, --resolution <name>', 'resolution name (e.g. \'Resolved\')', String)
    .option('-t, --timeSpent <time>', 'how much time spent (e.g. \'3h 30m\')', String)
    .description('Mark issue as finished.')
    .action((issue, options) => {
      if (options.timeSpent) {
        worklog.add(issue, options.timeSpent, 'auto worklog', new Date());
      }

      transitions.done(issue, options.resolution, finalCb);
    }).command('_complete', { hidden: true }).action(issuePickerCompletionAsync);
  program
    .command('invalid <issue>')
    .description('Mark issue as finished.')
    .action((issue, options) => {
      transitions.invalid(issue, options, finalCb);
    }).command('_complete', { hidden: true }).action(issuePickerCompletionAsync);
  program
    .command('mark <issue> [transitionId]')
    .description('Mark issue as.')
    .action((issue, transitionId) => {
      if (transitionId) { // if a transitionId is provided, go straight to transitioning the story
        transitions.doTransition(issue, transitionId, err => {
          if (err && err.includes('(502)')) { // if we get a 502 it's most likely because the transition isn't valid
            console.log('transition (' + transitionId + ') not valid for this issue (' + issue + ')');
          } else {
            console.log('marked issue with transition ' + transitionId);
          }
          finalCb(err);
        });
      } else {
        transitions.makeTransition(issue, finalCb);
      }
    });
  program
    .command('edit <issue> [input]')
    .description('edit issue.')
    .action((issue, input) => {
      if (input) {
        edit.editWithInputPutBody(issue, input, finalCb);
      } else {
        edit.edit(issue, finalCb);
      }
    });
  program
    .command('running')
    .description('List issues in progress.')
    .action(() => {
      ls.showInProgress(finalCb);
    });
  program
    .command('jql <query>')
    .description('Run JQL query')
    .option('-c, --custom <name>', 'Filter by custom jql saved in jira config')
    .option('-s, --custom_sql <name>', 'Filter by custom alasql saved in jira config')
    .option('-j, --json <value>', 'Output in json', String(0))
    .option('-v, --verbose', 'verbose output')
    .action((query, options) => {
      if (options.custom_sql) {
        ls.aggregateResults(query, options, finalCb);
      } else if (options.json) {
        ls.jqlSearch(query, options, (err, issues) => {
          if (issues) {
            console.log(JSON.stringify(issues));
          }
          finalCb(err);
        });
      } else {
        ls.jqlSearch(query, options, finalCb);
      }
    });
  program
    .command('link <from> <to> [linkValue]')
    .description('link issues')
    .action((from, to, linkValue, options) => {
      link(from, to, linkValue, options, finalCb);
    });
  program
    .command('search <term>')
    .description('Find issues.')
    .action(query => {
      ls.search(query, finalCb);
    });
  program
    .command('assign <issue> [accountId]')
    .description('Assign an issue to <user>. Provide only issue# to assign to me')
    .action((issue, user) => {
      if (user) {
        user = config.user_alias[user] || user;
        assign().to(issue, user);
      } else {
        assign().me(issue);
      }
    });
  program
    .command('watch <issue> [user]')
    .description('Watch an issue to <user>. Provide only issue# to watch to me')
    .action((issue, user) => {
      if (user) {
        user = config.user_alias[user];
        watch.to(issue, user);
      } else {
        watch.me(issue);
      }
    });
  program
    .command('comment <issue> [text]')
    .description('Comment an issue.')
    .action(function(issue, text) {
      if (text) {
        //replace name in comment text if present in user_alias config
        //if vikas is nickname stored in user_alias config for vikas.sharma
        //then 'vikas has username [~vikas] [~ajitk] [~mohit] becomes 'vikas has username [~vikas.sharma] [~ajitk] [~mohit]
        //names which do not match any alias are not changed
        text = text.replace(/\[~(.*?)\]/g, function(match, tag, index) {
          if (config.user_alias[tag]) {
            return '[~' + config.user_alias[tag] + ']';
          } else {
            return tag;
          }
        });
        comment().to(issue, text);
      } else {
        comment().show(issue);
      }
    });
  await addDescribeCommand(program);
  // program
  //   .command('show <issue>')
  //   .description('Show info about an issue')
  //   .option('-o, --output <field>', 'Output field content', String)
  //   .action(function(issue, options) {
  //     if (options.output) {
  //       describe.show(issue, options.output);
  //     } else {
  //       describe.show(issue);
  //     }
  //   }).command('_complete')
  //   .action(issuePickerCompletionAsync);


  program
    .command('open <issue>')
    .description('Open an issue in a browser')
    .action(function(issue, options) {
      describe.open(issue);
    }).command('_complete', { hidden: true })
    .action(issuePickerCompletionAsync);
  program
    .command('worklog <issue>')
    .description('Show worklog about an issue')
    .action(function(issue) {
      worklog.show(issue);
    }).command('_complete', { hidden: true }).action(issuePickerCompletionAsync);
  program
    .command('worklogadd <issue> <timeSpent> [comment]')
    .description('Log work for an issue')
    .option('-s, --startedAt [value]', 'Set date of work (default is now)')
    .action(function(issue, timeSpent, comment, p) {
      const o = p.startedAt || new Date().toString(),
        s = new Date(o);
      worklog.add(issue, timeSpent, comment, s);
    })
    .on('--help', function() {
      console.log('  Worklog Add Help:');
      console.log();
      console.log('    <issue>: JIRA issue to log work for');
      console.log('    <timeSpent>: how much time spent (e.g. \'3h 30m\')');
      console.log('    <comment> (optional) comment');
      console.log();
    });
  await addJiraCreateCommand(program, finalCb);
  //
  // program
  //   .command('create [project[-issue]]')
  //   .details('Create an issue or a sub-task')
  //   .option<string>('-p, --project <project>', 'Rapid board on which project is to be created', String)
  //   .option<string>('-P, --priority <priority>', 'priority of the issue', String)
  //   .option('-T --type <type>', 'NUMERIC Issue type', parseInt)
  //   .option<string>('-s --subtask <subtask>', 'Issue subtask', undefined)
  //   .option('-S --summary <summary>', 'Issue Summary', undefined)
  //   .option('-d --details <details>', 'Issue details', undefined)
  //   .option('-a --assignee <assignee>', 'Issue assignee',undefined)
  //   .option('-v --verbose', 'Verbose debugging output')
  //   .action((projectIssue, options) => {
  //     options.parent = projectIssue;
  //     if (config && config.authNew) {
  //       const jira = new JiraClient({
  //         host: config.authNew.host,
  //         // eslint-disable-next-line camelcase
  //         basic_auth: {
  //           base64: config.authNew.token
  //         }
  //       });
  //       const _create = create(jira);
  //       // @ts-ignore
  //       _create.newIssue(projectIssue, options);
  //     }
  //   });
  program
    .command('new [key]')
    .description('Create an issue or a sub-task')
    .option('-p, --project <project>', 'Rapid board on which project is to be created', String)
    .option('-P, --priority <priority>', 'priority of the issue', String)
    .option('-T --type <type>', 'Issue type', String)
    .option('-s --subtask <subtask>', 'Issue subtask', String)
    .option('-S --summary <summary>', 'Issue summary', String)
    .option('-d --details <details>', 'Issue details', String)
    .option('-c --component <component>', 'Issue component', String)
    .option('-l --label <label>', 'Issue label', String)
    .option('-a --assignee <assignee>', 'Issue assignee', String)
    .option('-v --verbose', 'Verbose debugging output')
    .action((key, options) => {
      options.key = key;
      newCreate().create(options, finalCb);
    });
  program
    .command('config')
    .description('Change configuration')
    .option('-c, --clear', 'Clear stored configuration')
    .option('-u, --url', 'Print url in config')
    .option('-t, --template <template>', 'Start config with this given template', String)
    .option('-v, --verbose', 'verbose debugging output')
    .action(function(options) {
      if (options.clear) {
        auth.clearConfig();
      } else {
        if (options.url) {
          console.log(config.auth.url);
        } else {
          auth.setup(options);
        }
      }
    })
    .on('--help', function() {
      console.log('  Config Help:');
      console.log();
      console.log('    Jira URL: https://foo.atlassian.net/');
      console.log('    Username: user (for user@foo.bar)');
      console.log('    Password: Your password');
      console.log('');
      console.log('WARNING:After three failed login attempts Atlassian forces a CAPTCHA login');
      console.log('WARNING:  which can only be done via the browser.');
    });
  program
    .command('sprint')
    .description(
      'Works with sprint boards\n' +
      '\t\t\t\tWith no arguments, displays all rapid boards\n' +
      '\t\t\t\tWith -r argument, attempt to find a single rapid board\n ' +
      '\t\t\t\tand display its active sprints\n' +
      '\t\t\t\tWith both -r and -s arguments\n ' +
      '\t\t\t\tattempt to get a single rapidboard/ sprint and show its issues. If\n ' +
      '\t\t\t\ta single sprint board isnt found, show all matching sprint boards\n'
    )
    .option('-r, --rapidboard <name>', 'Rapidboard to show sprints for', String)
    .option('-s, --sprint <name>', 'Sprint to show the issues', String)
    .option('-a, --add <projIssue> ', 'Add project issue to sprint', String)
    .option('-i, --sprintId <sprintId> ', 'Id of the sprint which you want your issues to be added to', String)
    .option('-j, --jql <jql> ', 'jql of the issues which you want to add to the sprint', String)
    .action(function(options) {
      if (options.add) {
        addToSprint().addIssuesViaKey(options, finalCb);
      } else if (options.jql) {
        addToSprint().addAllJqlToSprint(options, finalCb);
      } else {
        sprint(options.rapidboard, options.sprint, finalCb);
      }
    });
  program
    .command('fix <issue> <version>')
    .description('Set FixVersion of an issue to <version>.')
    .option('-a, --append', 'Append fix instead of over-write')
    .action(function(issue, version, options) {
      if (options.append) {
        fix.append(issue, version);
      } else {
        fix.to(issue, version);
      }
    });
  program
    .command('release <version>')
    .description('Create a FixVersion/Release (see release -h for more details)')
    .option('-p, --project <name>', 'Project', String)
    .option('-d, --details <name>', 'Description', String)
    .option('-r, --released', 'Set released to true - default is false')
    .action(function(version, options) {
      release.create(version, options);
    });
  program
    .command('send')
    .description('Send email report (see send -h for more details)')
    .option('-i, --projectId <id>', 'Project ID', String)
    .option('-p, --project_prefix <XX>', 'Project Prefix', String)
    .option('-v, --version <number>', 'Version ID Number', String)
    .option('-n, --name <name>', 'release name', String)
    .option('-f, --from <name>', 'from name', String)
    .option('-t, --to <name>', 'comma seperated email list', String)
    .option('-c, --cc <name>', 'comma seperated email list', String)
    .option('-s, --subject <name>', 'email subject', String)
    .option('-x, --password <password>', 'email password', String)
    .option('-e, --template <file>', 'email template', String)
    .action(function(options) {
      send.send(options);
    });
  await program.parseAsync();
  process.exit(0);
  if (program.args.length === 0) {
    console.log('\nYour first step is to run the config option.\n');
    program.help();
  }
})();
