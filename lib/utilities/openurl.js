"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mailto = exports.open = void 0;
const child_process_1 = require("child_process");
let command;
switch (process.platform) {
    case 'darwin':
        command = 'open';
        break;
    case 'win32':
        command = 'explorer.exe';
        break;
    case 'linux':
        command = 'xdg-open';
        break;
    default:
        throw new Error('Unsupported platform: ' + process.platform);
}
async function open(url) {
    try {
        child_process_1.spawn(command, [url], { shell: false, stdio: 'ignore', detached: true });
    }
    catch (e) {
        console.error(e);
        process.exit(1);
    }
}
exports.open = open;
function mailto(recipients, fields, recipientsSeparator) {
    recipientsSeparator = recipientsSeparator || ',';
    let url = 'mailto:' + recipients.join(recipientsSeparator);
    Object.keys(fields).forEach(function (key, index) {
        if (index === 0) {
            url += '?';
        }
        else {
            url += '&';
        }
        url += key + '=' + encodeURIComponent(fields[key]);
    });
    open(url);
}
exports.mailto = mailto;
exports.open = open;
exports.mailto = mailto;
