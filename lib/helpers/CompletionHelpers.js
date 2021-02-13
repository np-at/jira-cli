"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.issuePickerCompletionAsync = void 0;
const helpers_1 = require("./helpers");
const os_1 = __importDefault(require("os"));
async function issuePickerCompletionAsync(...args) {
    try {
        const issueSuggestions = await helpers_1.client.issueSearch.getIssuePickerSuggestions({ query: args[1]?.args?.join(' ') ?? '' });
        console.log(issueSuggestions.sections.flatMap(x => x.issues).map(x => String(`${x.key}|*|${x.summary}`)).join(os_1.default.EOL));
        return;
    }
    catch (e) {
        console.error(e);
    }
}
exports.issuePickerCompletionAsync = issuePickerCompletionAsync;
