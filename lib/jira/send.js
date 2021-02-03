"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/*global requirejs,console,define,fs*/
const ssl_request_1 = __importDefault(require("../ssl_request"));
const config_1 = __importDefault(require("../config"));
const cheerio_1 = __importDefault(require("cheerio"));
const nodemailer_1 = __importDefault(require("nodemailer"));
const fs_1 = __importDefault(require("fs"));
const underscore_1 = __importDefault(require("underscore"));
exports.default = (() => {
    const report = {
        query: null,
        table: null,
        send: options => {
            ssl_request_1.default.post(config_1.default.auth.url + 'secure/ReleaseNote.jspa')
                .query({ projectId: options.projectId })
                .query({ version: options.version })
                .end((error, response) => {
                if (error)
                    throw new Error(error);
                const $ = cheerio_1.default.load(response.body);
                const editcopy = $('textarea#editcopy').text();
                const transporter = nodemailer_1.default.createTransport({
                    service: 'gmail',
                    auth: {
                        user: config_1.default.auth.user,
                        pass: options.password
                    }
                });
                const templateContent = fs_1.default.readFileSync(options.template, 'utf8');
                const data = {
                    release_version: options.name,
                    link: config_1.default.auth.url + 'projects/' + options.project_prefix + '/versions/' + options.version,
                    report: editcopy
                };
                underscore_1.default.templateSettings = {
                    interpolate: /\{\{(.+?)\}\}/g
                };
                const getHTML = underscore_1.default.template(templateContent);
                const html_body = getHTML(data);
                const send_it = async () => {
                    const info = await transporter.sendMail({
                        from: config_1.default.auth.user,
                        to: options.to,
                        cc: options.cc,
                        subject: options.subject,
                        html: html_body
                    });
                    console.log('Message sent: %s', info.messageId);
                };
                send_it();
            });
        }
    };
    return report;
})();
