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
async function open(url, callback) {
    const child = await child_process_1.spawn(command, [url], { shell: true, stdio: 'ignore', detached: true });
    let errorText = '';
    child.stderr.setEncoding('utf8');
    child.stderr.on('data', function (data) {
        errorText += data;
    });
    child.stderr.on('end', function () {
        const error = new Error(errorText);
        if (errorText.length > 0) {
            if (callback) {
                callback(error);
            }
            else {
                throw error;
            }
        }
        else if (callback) {
            callback(error);
        }
    });
}
exports.open = open;
function mailto(recipients, fields, recipientsSeparator, callback) {
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
    open(url, callback);
}
exports.mailto = mailto;
exports.open = open;
exports.mailto = mailto;
