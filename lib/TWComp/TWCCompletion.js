"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.mixinCommandPrototype = exports.CompletableProto = exports.CompletableP = void 0;
const completion_1 = __importDefault(require("./completion"));
const commander_1 = __importDefault(require("commander"));
class CompletableP extends commander_1.default.Command {
    constructor(...args) {
        super(...args);
    }
    completion(_completion) {
        this._completion = _completion;
        return this;
    }
    complete(params, cb) {
        cb = cb || function (err, results) {
            if (err) {
                throw err;
            }
            results.forEach(function (result) {
                console.log(result);
            });
        };
        function getCompletionTree(node) {
            const nodeName = node.name();
            const retVal = {
                name: nodeName,
                completion: undefined,
                commands: undefined,
                options: undefined
            };
            if (node._completion) {
                retVal.completion = node._completion;
            }
            else {
                retVal.commands = node.commands.map(function addCommand(command) {
                    return getCompletionTree(command);
                });
            }
            retVal.options = [];
            node.options?.forEach(function addCommandOption(option) {
                function completeOption(info, cb) {
                    if (option.required) {
                        info = this.shiftLeftWord(info);
                    }
                    if (option.optional) {
                        const leftmostWord = info.words.remainingLeft[0];
                        if (leftmostWord && leftmostWord[0] !== '-') {
                            info = this.shiftLeftWord(info);
                        }
                    }
                    this.resolveInfo(info, cb);
                }
                if (option.short) {
                    retVal.options.push({
                        name: option.short,
                        completion: completeOption
                    });
                }
                if (option.long) {
                    retVal.options.push({
                        name: option.long,
                        completion: completeOption
                    });
                }
            });
            return retVal;
        }
        const tree = getCompletionTree(this);
        const completion = new completion_1.default(tree);
        if (completion.name) {
            const err = new Error('`commander-completion` requires `program.name` to be defined in order to operate');
            return process.nextTick(function () {
                cb(err);
            });
        }
        completion.complete(params, cb);
    }
}
exports.CompletableP = CompletableP;
exports.CompletableProto = {
    completion: function (_completion) {
        this._completion = _completion;
        return this;
    },
    complete: function (params, cb) {
        cb = cb || function (err, results) {
            if (err) {
                throw err;
            }
            results.forEach(function (result) {
                console.log(result);
            });
        };
        function getCompletionTree(node) {
            let nodeName = node.name;
            if (nodeName) {
                if (typeof nodeName === 'function') {
                    nodeName = node.name();
                }
            }
            else {
                nodeName = node._name;
            }
            const retVal = {
                name: nodeName,
                completion: undefined,
                commands: undefined,
                options: undefined
            };
            if (node._completion) {
                retVal.completion = node._completion;
            }
            else {
                retVal.commands = node.commands.map(function addCommand(command) {
                    return getCompletionTree(command);
                });
            }
            retVal.options = [];
            node.options.forEach(function addCommandOption(option) {
                function completeOption(info, cb) {
                    if (option.required) {
                        info = this.shiftLeftWord(info);
                    }
                    if (option.optional) {
                        const leftmostWord = info.words.remainingLeft[0];
                        if (leftmostWord && leftmostWord[0] !== '-') {
                            info = this.shiftLeftWord(info);
                        }
                    }
                    this.resolveInfo(info, cb);
                }
                if (option.short) {
                    retVal.options.push({
                        name: option.short,
                        completion: completeOption
                    });
                }
                if (option.long) {
                    retVal.options.push({
                        name: option.long,
                        completion: completeOption
                    });
                }
            });
            return retVal;
        }
        const tree = getCompletionTree(this);
        const completion = new completion_1.default(tree);
        if (completion.name) {
            const err = new Error('`commander-completion` requires `program.name` to be defined in order to operate');
            return process.nextTick(function () {
                cb(err);
            });
        }
        completion.complete(params, cb);
    }
};
function mixinCommandPrototype(commandPrototype) {
    Object.getOwnPropertyNames(exports.CompletableProto).forEach(function (key) {
        commandPrototype[key] = exports.CompletableProto[key];
    });
    return commandPrototype;
}
exports.mixinCommandPrototype = mixinCommandPrototype;
function mixinCommanderCompletion(commander) {
    mixinCommandPrototype(commander.command.prototype);
    return commander;
}
exports.default = mixinCommanderCompletion;
