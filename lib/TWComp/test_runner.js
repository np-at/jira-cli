"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const TWCCompletion_1 = require("./TWCCompletion");
const commander_1 = __importDefault(require("commander"));
const prog = new commander_1.default.Command();
const s = new TWCCompletion_1.CompletableP(prog);
s
    .command('ls')
    .description('List my issues')
    .option('-p, --project <name>', 'Filter by project', String)
    .option('-t, --type <type>', 'Filter by type', String)
    .option('-v, --verbose', 'verbose output')
    .action(async (options) => {
    let err, results;
    console.log(...options);
});
s.complete({ line: 'l', cursor: 1 }, (a, b) => {
    console.log(a);
    console.log(b);
});
console.debug('results', s);
