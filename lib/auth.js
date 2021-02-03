"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const inquirer_1 = __importDefault(require("inquirer"));
const config_1 = __importDefault(require("./config"));
const prompt = inquirer_1.default.createPromptModule();
exports.default = {
    answers: {},
    ask: function (question, callback, password) {
        if (password) {
            prompt({ type: 'password', message: question })
                .then((answer) => {
                if (answer.length > 0) {
                    callback(answer);
                }
                else {
                    this.ask(question, callback, true);
                }
            });
        }
        else {
            prompt({ message: question }).then(function (answer) {
                if (answer.length > 0) {
                    callback(answer);
                }
                else {
                    this.ask(question, callback);
                }
            });
        }
    },
    setup(options) {
        if (!config_1.default.isLoaded()) {
            // If not then create it
            this.ask('Jira URL: ', (answer) => {
                this.answers.url = answer;
                this.ask('Username: ', function (answer) {
                    this.answers.user = answer;
                    this.ask('Password: ', function (answer) {
                        this.answers.pass = answer;
                        process.stdin.destroy();
                        this.saveConfig(options);
                    }, true);
                });
            });
        }
    },
    clearConfig() {
        prompt({ message: 'Are you sure?', default: false, type: 'confirm' })
            .then(function (answer) {
            if (answer) {
                config_1.default.clear();
                console.log('Configuration deleted successfully!');
            }
            process.stdin.destroy();
        });
    },
    saveConfig: function (options) {
        if (this.answers.url) {
            if (!/\/$/.test(this.answers.url)) {
                this.answers.url += '/';
            }
        }
        if (this.answers.user && this.answers.pass) {
            this.answers.token = this.answers.user + ':' + this.answers.pass;
            const auth = {
                url: this.answers.url,
                user: this.answers.user,
                token: Buffer.from(this.answers.token).toString('base64')
            };
            delete this.answers.pass;
            if (options.verbose) {
                console.log(options);
            }
            if (options.template && fs_1.default.existsSync(options.template)) {
                console.log('Using cli supplied default config file');
                config_1.default.loadInitialFromTemplate(options.template);
            }
            config_1.default.update('auth', auth);
            config_1.default.save();
            console.log('Information stored!');
        }
    }
};
