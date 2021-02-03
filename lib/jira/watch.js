"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/*global requirejs,console,define,fs*/
const ssl_request_1 = __importDefault(require("../ssl_request"));
const config_1 = __importDefault(require("../config"));
exports.default = (() => {
    const assign = {
        query: null,
        table: null,
        to: function (ticket, assignee) {
            this.query = 'rest/api/2/issue/' + ticket + '/watchers';
            ssl_request_1.default.post(config_1.default.auth.url + this.query).send('"' + assignee + '"').end((err, res) => {
                if (!res.ok) {
                    return console.log((res.body.errorMessages || [res.error]).join('\n'));
                }
                return console.log('Added ' + assignee + ' as watcher to [' + ticket + '] ' + '.');
            });
        },
        me: function (ticket) {
            this.to(ticket, config_1.default.auth.user);
        }
    };
    return assign;
})();
