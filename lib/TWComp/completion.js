"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const clone_1 = __importDefault(require("clone"));
const line_info_1 = __importDefault(require("./line-info"));
function Completion(tree) {
    this.node = tree;
}
Completion.prototype = {
    shiftLeftWord: function (_info) {
        const info = clone_1.default(_info);
        const remainingLeftWords = info.words.remainingLeft;
        const leftmostWord = remainingLeftWords.shift();
        info.words.matchedLeft.push(leftmostWord);
        return info;
    },
    matchLeftWord: function (leftWord, words) {
        return words.filter(function findMatchingWords(word) {
            return leftWord === word.substr(0, leftWord.length);
        });
    },
    _guaranteeMatchedInfo: function (info) {
        if (!info.words.remainingLeft || !info.words.matchedLeft) {
            info = clone_1.default(info);
            if (!info.words.remainingLeft) {
                info.words.remainingLeft = info.words.partialLeft.slice(0);
            }
            if (!info.words.matchedLeft) {
                info.words.matchedLeft = [];
            }
        }
        return info;
    },
    complete: function (params, cb) {
        const info = line_info_1.default(params);
        return this.completeInfo(info, cb);
    },
    completeInfo: function (info, cb) {
        info = this._guaranteeMatchedInfo(info);
        info = this.shiftLeftWord(info);
        const matchedWord = info.words.matchedLeft[info.words.matchedLeft.length - 1];
        const node = this.node;
        if (matchedWord !== node.name) {
            return cb(null, []);
        }
        return this.resolveInfo(info, cb);
    },
    resolveInfo: function (info, cb) {
        info = this._guaranteeMatchedInfo(info);
        const node = this.node;
        if (info.words.remainingLeft.length === 0) {
            return cb(null, []);
        }
        if (info.words.remainingLeft.length === 1) {
            if (node.completion) {
                return node.completion.call(this, info, cb);
            }
            else if (node.commands) {
                const cmds = node.commands.map(function getCommandName(commandNode) {
                    return commandNode.name;
                });
                const partialLeftWord = info.word.partialLeft;
                const matchingCmds = this.matchLeftWord(partialLeftWord, cmds);
                matchingCmds.sort();
                return cb(null, matchingCmds);
            }
            else {
                return cb(null, []);
            }
        }
        else {
            const nextWord = info.words.remainingLeft[0];
            const optionNodes = node.options || [];
            const matchedOptionNode = optionNodes.filter(function matchoption(optionNode) {
                return optionNode.name === nextWord;
            })[0];
            if (matchedOptionNode) {
                if (matchedOptionNode.completion) {
                    info = this.shiftLeftWord(info);
                    return matchedOptionNode.completion.call(this, info, cb);
                }
                else {
                    return cb(null, []);
                }
            }
            const commandNodes = node.commands || [];
            let matchedCommandNode;
            let i = 0;
            const len = commandNodes.length;
            for (; i < len; i++) {
                const commandNode = commandNodes[i];
                if (commandNode.name === nextWord) {
                    matchedCommandNode = commandNode;
                }
            }
            if (matchedCommandNode) {
                const childCompletion = new Completion(matchedCommandNode);
                return childCompletion.completeInfo(info, cb);
            }
            cb(null, []);
        }
    }
};
exports.default = Completion;
