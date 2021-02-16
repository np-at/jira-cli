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
exports.CommandWComplete = exports.completionSeparator = void 0;
const commander_1 = __importDefault(require("commander"));
const os = __importStar(require("os"));
exports.completionSeparator = '|*|';
class RetobImpl {
    constructor() {
        this.match = (prop) => {
            if (prop.startsWith('-')) {
                return this.options.filter(x => (x.short.normalize().startsWith(prop.normalize()))).map(x => ({ name: x.short, type: 'option', description: x.description }));
            }
            return this.subcommands.filter(x => x.name.normalize().startsWith(prop.normalize())).map(x => ({ name: x.name, type: 'command', description: x.description, ref: x }));
        };
    }
}
const genNode = (cmd) => {
    const help = cmd.createHelp();
    const o = new RetobImpl();
    o.description = cmd.description();
    o.name = cmd.name();
    o.options = help.visibleOptions(cmd).map(x => ({
        name: x.name(),
        short: x.short,
        long: x.long,
        description: x.description,
        valueReq: x.required
    }));
    o.subcommands = help.visibleCommands(cmd).map(x => genNode(x));
    return o;
};
class CommandWComplete extends commander_1.default.Command {
    constructor() {
        super(...arguments);
        this.addCompletion = (cb) => {
            this.command('_complete [cursorPosition] [commandAST] [wordToComplete]', { hidden: true }).action((...args) => {
                try {
                    const callback = cb || this.defaultCompleter;
                    Promise.resolve(callback(args[0], args[1], args[2])).then(value => console.log(value?.join(os.EOL))).catch(error => console.error(error));
                }
                catch (e) {
                    console.error(e);
                }
            });
            return this;
        };
        this.genTree = () => genNode(this);
        this.defaultCompleter = (cursorPos, commandAST, wordToComplete) => {
            const ast = this.genTree();
            const args = commandAST?.split(' ') ?? [];
            let currentNode = ast;
            if (args.length === 0)
                return ast.subcommands.map(x => `${x.name}${exports.completionSeparator}${x.description}`).concat(ast.options.map(x => `${x.long}${exports.completionSeparator}${x.description}`));
            for (let i = 0; i < args.length; i++) {
                if (i === args.length - 1) {
                    if (isCursorExtended(commandAST, cursorPos) || args[i].trim() === '')
                        return currentNode.subcommands.map(x => `${x.name}${exports.completionSeparator}${x.description}`).concat(currentNode.options.map(x => `${x.long}${exports.completionSeparator}${x.description}`));
                }
                if (ast.name.normalize() === args[i].normalize() || args[i].normalize() === 'jira'.normalize())
                    continue;
                const m = currentNode.match(args[i]);
                if (m.length === 0)
                    return currentNode.subcommands.map(x => `${x.name}${exports.completionSeparator}${x.description}`).concat(currentNode.options.map(x => `${x.long}${exports.completionSeparator}${x.description}`));
                if (m.length === 1) {
                    if (m[0].hasOwnProperty('ref')) {
                        if (i === args.length - 1 && !isCursorExtended(commandAST, cursorPos)) {
                            return m.map(x => `${x.name}${exports.completionSeparator}`);
                        }
                        currentNode = m[0]['ref'];
                        continue;
                    }
                }
                return m.map(x => {
                    return `${x.name}${exports.completionSeparator}`;
                });
            }
        };
    }
    createCommand(name, completionCB) {
        return new CommandWComplete(name);
    }
}
exports.CommandWComplete = CommandWComplete;
const isCursorExtended = (input, cursorPos) => (cursorPos >= input.trimEnd().length);
