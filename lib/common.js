"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ask = void 0;
/* eslint-disable max-depth */
const initial_config_1 = require("./initial_config");
const inquirer_1 = __importDefault(require("inquirer"));
const prompt = inquirer_1.default.createPromptModule();
function ask(question, callback, yesno = undefined, values = [], answer = undefined) {
    const options = initial_config_1.options || {}, issueTypes = [];
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
                }
                else {
                    issueTypes.push('(' + values[i].id + ') ' + (values[i].name ? values[i].name : values[i].value));
                }
            }
            else {
                if (!values[i].subtask) {
                    issueTypes.push('(' + values[i].id + ') ' + (values[i].name ? values[i].name : values[i].value));
                }
            }
        }
        console.log(issueTypes.join('\n'));
    }
    prompt({ message: question }).then(function (answer) {
        if (answer.length > 0) {
            callback(answer);
        }
        else {
            if (yesno) {
                callback(false);
            }
            else {
                this.ask(question, callback);
            }
        }
    });
}
exports.ask = ask;
