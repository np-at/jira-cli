import { spawn } from 'child_process';

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

/**
 * Error handling is deliberately minimal, as this function is to be easy to use for shell scripting
 *
 * @param url The URL to open
 */

export async function open(url:string): Promise<void> {
  try {
    spawn(command, [url], { shell: false, stdio: 'ignore', detached: true });
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}

/**
 * @param recipients array of recipients addresses
 * @param fields Common fields are: "subject", "body".
 *     Some email apps let you specify arbitrary headers here.
 * @param recipientsSeparator Default is ",". Use ";" for Outlook.
 */
export function mailto(recipients: string[], fields: string[], recipientsSeparator:string): void {
  recipientsSeparator = recipientsSeparator || ',';

  let url = 'mailto:' + recipients.join(recipientsSeparator);
  Object.keys(fields).forEach(function (key, index) {
    if (index === 0) {
      url += '?';
    } else {
      url += '&';
    }
    url += key + '=' + encodeURIComponent(fields[key]);
  });
  open(url);
}

exports.open = open;
exports.mailto = mailto;
