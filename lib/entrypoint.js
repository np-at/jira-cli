"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = __importDefault(require("./config"));
const auth_1 = __importDefault(require("./auth"));
const ls_1 = __importStar(require("./jira/ls"));
const describe_1 = __importStar(require("./jira/describe"));
const assign_1 = __importDefault(require("./jira/assign"));
const fix_1 = __importDefault(require("./jira/fix"));
const release_1 = __importDefault(require("./jira/release"));
const send_1 = __importDefault(require("./jira/send"));
const comment_1 = __importStar(require("./jira/comment"));
const sprint_1 = __importDefault(require("./jira/sprint"));
const transitions_1 = __importStar(require("./jira/transitions"));
const worklog_1 = __importDefault(require("./jira/worklog"));
const link_1 = __importDefault(require("./jira/link"));
const watch_1 = __importDefault(require("./jira/watch"));
const addToSprint_1 = __importDefault(require("./jira/addToSprint"));
const new_1 = __importDefault(require("./jira/new"));
const edit_1 = __importDefault(require("./jira/edit"));
const create_1 = __importDefault(require("./jira/create"));
const os = __importStar(require("os"));
const CompletionHelpers_1 = require("./helpers/CompletionHelpers");
const package_json_1 = __importDefault(require("../package.json"));
const CommandWComplete_1 = require("./Extensions/CommandWComplete");
(async () => {
    function finalCb(err, results) {
        if (err) {
            console.log(...err.toString());
            process.exit(1);
        }
        process.exit(0);
    }
    const program = new CommandWComplete_1.CommandWComplete().enablePositionalOptions(true).storeOptionsAsProperties(false).allowUnknownOption(false).allowExcessArguments(true).passThroughOptions(true);
    program.version(package_json_1.default.version);
    ls_1.addCommand_ls(program, finalCb);
    program.command('_complete [cursorPos] [commandAst] [wordToComplete]', { hidden: true }).action(async (...args) => {
        const cursorPos = parseInt(args[0]);
        const wordToComplete = args[2];
        const currentInput = args[1].split(' ');
        const app = currentInput.shift();
        const commands = program.commands.map(x => x.name()).filter(x => x !== '_complete');
        if (currentInput.length === 0) {
            console.log(program.commands.filter(x => x.name() !== '_complete').flatMap(x => (`${x.name()}|*|${x.usage()}`)).join(os.EOL));
            return;
        }
        else if (currentInput.length === 1) {
            if (args[1].length >= cursorPos) {
                console.log(commands.filter(x => x.normalize().startsWith(currentInput[0].normalize())).join(os.EOL));
                return;
            }
        }
        let currentCommand = program._findCommand(currentInput[0]);
        for (let i = 1; i <= currentInput.length; i++) {
            try {
                if (currentInput[i]?.startsWith('-')) {
                    const options = currentCommand.options.filter(x => x.long?.startsWith(currentInput[i]));
                    console.log(options.map(x => String(x.long + '|*|' + x.description)).join(os.EOL));
                    return;
                }
                const nextArg = currentCommand.commands.find(x => x?.name()?.normalize() === currentInput[i]?.normalize());
                if (!nextArg || i >= currentInput.length - 1) {
                    try {
                        if (currentCommand.commands.length === 0) {
                            console.log(currentCommand.options.map(x => String(x.long + '|*|' + x.description)).join(os.EOL));
                        }
                        const extraArgs = currentInput.slice(i) ?? [];
                        currentCommand._dispatchSubcommand('_complete', extraArgs, []);
                        return;
                    }
                    catch (e) {
                        console.log(e);
                        console.error(e);
                    }
                }
                else {
                    currentCommand = nextArg;
                }
            }
            catch (e) {
                console.log(e);
            }
        }
        console.log('ERRROR');
    });
    program
        .command('start <issue>')
        .description('Start working on an issue.')
        .action(async (issue) => {
        try {
            await transitions_1.startIssue(issue, finalCb);
        }
        catch (e) {
            console.error(e);
        }
    }).command('_complete', { hidden: true }).action(CompletionHelpers_1.issuePickerCompletionAsync);
    program
        .command('stop <issue>')
        .description('Stop working on an issue.')
        .action(issue => {
        transitions_1.default.stop(issue, finalCb);
    }).command('_complete', { hidden: true }).action(CompletionHelpers_1.issuePickerCompletionAsync);
    program
        .command('review <issue> [assignee]')
        .description('Mark issue as being reviewed [by assignee(optional)].')
        .action((issue, assignee) => {
        transitions_1.default.review(issue, finalCb);
        if (assignee) {
            assign_1.default().to(issue, assignee);
        }
    }).command('_complete', { hidden: true }).action(CompletionHelpers_1.issuePickerCompletionAsync);
    program
        .command('done <issue>')
        .option('-r, --resolution <name>', 'resolution name (e.g. \'Resolved\')', String)
        .option('-t, --timeSpent <time>', 'how much time spent (e.g. \'3h 30m\')', String)
        .description('Mark issue as finished.')
        .action((issue, options) => {
        if (options.timeSpent) {
            worklog_1.default.add(issue, options.timeSpent, 'auto worklog', new Date());
        }
        transitions_1.default.done(issue, options.resolution, finalCb);
    }).command('_complete', { hidden: true }).action(CompletionHelpers_1.issuePickerCompletionAsync);
    program
        .command('invalid <issue>')
        .description('Mark issue as finished.')
        .action((issue, options) => {
        transitions_1.default.invalid(issue, options, finalCb);
    }).command('_complete', { hidden: true }).action(CompletionHelpers_1.issuePickerCompletionAsync);
    program
        .command('mark <issue> [transitionId]')
        .description('Mark issue as.')
        .action((issue, transitionId) => {
        if (transitionId) {
            transitions_1.default.doTransition(issue, transitionId, err => {
                if (err && err.includes('(502)')) {
                    console.log('transition (' + transitionId + ') not valid for this issue (' + issue + ')');
                }
                else {
                    console.log('marked issue with transition ' + transitionId);
                }
                finalCb(err);
            });
        }
        else {
            transitions_1.default.makeTransition(issue, finalCb);
        }
    });
    program
        .command('edit <issue> [input]')
        .description('edit issue.')
        .action((issue, input) => {
        if (input) {
            edit_1.default.editWithInputPutBody(issue, input, finalCb);
        }
        else {
            edit_1.default.edit(issue, finalCb);
        }
    });
    program
        .command('running')
        .description('List issues in progress.')
        .action(() => {
        ls_1.default.showInProgress(finalCb);
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
            ls_1.default.aggregateResults(query, options, finalCb);
        }
        else if (options.json) {
            ls_1.default.jqlSearch(query, options, (err, issues) => {
                if (issues) {
                    console.log(JSON.stringify(issues));
                }
                finalCb(err);
            });
        }
        else {
            ls_1.default.jqlSearch(query, options, finalCb);
        }
    });
    program
        .command('link <from> <to> [linkValue]')
        .description('link issues')
        .action((from, to, linkValue, options) => {
        link_1.default(from, to, linkValue, options, finalCb);
    });
    program
        .command('search <term>')
        .description('Find issues.')
        .action(query => {
        ls_1.default.search(query, finalCb);
    });
    program
        .command('assign <issue> [accountId]')
        .description('Assign an issue to <user>. Provide only issue# to assign to me')
        .action((issue, user) => {
        if (user) {
            user = config_1.default.user_alias[user] || user;
            assign_1.default().to(issue, user);
        }
        else {
            assign_1.default().me(issue);
        }
    });
    program
        .command('watch <issue> [user]')
        .description('Watch an issue to <user>. Provide only issue# to watch to me')
        .action((issue, user) => {
        if (user) {
            user = config_1.default.user_alias[user];
            watch_1.default.to(issue, user);
        }
        else {
            watch_1.default.me(issue);
        }
    });
    program
        .command('comment <issue> [text]')
        .description('Comment an issue.')
        .action(async (issue, text) => {
        if (text) {
            text = text.replace(/\[~(.*?)\]/g, function (match, tag, index) {
                if (config_1.default.user_alias[tag]) {
                    return '[~' + config_1.default.user_alias[tag] + ']';
                }
                else {
                    return tag;
                }
            });
            await comment_1.jiraComment(issue, text);
        }
        else {
            comment_1.default().show(issue);
        }
    });
    describe_1.addDescribeCommand(program);
    program
        .command('open <issue>')
        .description('Open an issue in a browser')
        .action(function (issue, options) {
        describe_1.default.open(issue);
    }).command('_complete', { hidden: false })
        .action(CompletionHelpers_1.issuePickerCompletionAsync);
    program
        .command('worklog <issue>')
        .description('Show worklog about an issue')
        .action(function (issue) {
        worklog_1.default.show(issue);
    }).command('_complete', { hidden: true }).action(CompletionHelpers_1.issuePickerCompletionAsync);
    program
        .command('worklogadd <issue> <timeSpent> [comment]')
        .description('Log work for an issue')
        .option('-s, --startedAt [value]', 'Set date of work (default is now)')
        .action(function (issue, timeSpent, comment, p) {
        const o = p.startedAt || new Date().toString(), s = new Date(o);
        worklog_1.default.add(issue, timeSpent, comment, s);
    })
        .on('--help', function () {
        console.log('  Worklog Add Help:');
        console.log();
        console.log('    <issue>: JIRA issue to log work for');
        console.log('    <timeSpent>: how much time spent (e.g. \'3h 30m\')');
        console.log('    <comment> (optional) comment');
        console.log();
    });
    await create_1.default(program, finalCb);
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
        new_1.default().create(options, finalCb);
    });
    program
        .command('config')
        .description('Change configuration')
        .option('-c, --clear', 'Clear stored configuration')
        .option('-u, --url', 'Print url in config')
        .option('-t, --template <template>', 'Start config with this given template', String)
        .option('-v, --verbose', 'verbose debugging output')
        .action(function (options) {
        if (options.clear) {
            auth_1.default.clearConfig();
        }
        else {
            if (options.url) {
                console.log(config_1.default.auth.url);
            }
            else {
                auth_1.default.setup(options);
            }
        }
    })
        .on('--help', function () {
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
        .description('Works with sprint boards\n' +
        '\t\t\t\tWith no arguments, displays all rapid boards\n' +
        '\t\t\t\tWith -r argument, attempt to find a single rapid board\n ' +
        '\t\t\t\tand display its active sprints\n' +
        '\t\t\t\tWith both -r and -s arguments\n ' +
        '\t\t\t\tattempt to get a single rapidboard/ sprint and show its issues. If\n ' +
        '\t\t\t\ta single sprint board isnt found, show all matching sprint boards\n')
        .option('-r, --rapidboard <name>', 'Rapidboard to show sprints for', String)
        .option('-s, --sprint <name>', 'Sprint to show the issues', String)
        .option('-a, --add <projIssue> ', 'Add project issue to sprint', String)
        .option('-i, --sprintId <sprintId> ', 'Id of the sprint which you want your issues to be added to', String)
        .option('-j, --jql <jql> ', 'jql of the issues which you want to add to the sprint', String)
        .action(function (options) {
        if (options.add) {
            addToSprint_1.default().addIssuesViaKey(options, finalCb);
        }
        else if (options.jql) {
            addToSprint_1.default().addAllJqlToSprint(options, finalCb);
        }
        else {
            sprint_1.default(options.rapidboard, options.sprint, finalCb);
        }
    });
    program
        .command('fix <issue> <version>')
        .description('Set FixVersion of an issue to <version>.')
        .option('-a, --append', 'Append fix instead of over-write')
        .action(function (issue, version, options) {
        if (options.append) {
            fix_1.default.append(issue, version);
        }
        else {
            fix_1.default.to(issue, version);
        }
    });
    program
        .command('release <version>')
        .description('Create a FixVersion/Release (see release -h for more details)')
        .option('-p, --project <name>', 'Project', String)
        .option('-d, --details <name>', 'Description', String)
        .option('-r, --released', 'Set released to true - default is false')
        .action(function (version, options) {
        release_1.default.create(version, options);
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
        .action(function (options) {
        send_1.default.send(options);
    });
    if (!config_1.default?.auth.url)
        auth_1.default.setup({});
    else {
        await program.parseAsync();
    }
    if (!config_1.default.tree) {
        config_1.default.update('tree', program.genTree());
        config_1.default.save();
    }
    if (program.args?.length === 0) {
        console.log('\nYour first step is to run the config option.\n');
        program.help();
    }
})();
