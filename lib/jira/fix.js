"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/*global requirejs,console,define,fs*/
const ssl_request_1 = __importDefault(require("../ssl_request"));
const config_1 = __importDefault(require("../config"));
exports.default = (() => {
    const fix = {
        query: null,
        to: function (ticket, version) {
            this.query = 'rest/api/2/issue/' + ticket;
            ssl_request_1.default.put(config_1.default.auth.url + this.query).send({
                'update': {
                    'fixVersions': [{
                            'set': [{
                                    'name': version
                                }]
                        }]
                }
            }).end((err, res) => {
                if (!res.ok) {
                    return console.log((res.body.errorMessages || [res.error]).join('\n'));
                }
                return console.log('FixVersion [' + ticket + '] set to ' + version + '.');
            });
        },
        append: function (ticket, version) {
            this.query = 'rest/api/2/issue/' + ticket;
            ssl_request_1.default.put(config_1.default.auth.url + this.query).send({
                'update': {
                    'fixVersions': [{
                            'add': {
                                'name': version
                            }
                        }]
                }
            }).end((err, res) => {
                if (!res.ok) {
                    return console.log((res.body.errorMessages || [res.error]).join('\n'));
                }
                return console.log('Appended FixVersion ' + version + ' to [' + ticket + '].');
            });
        }
    };
    return fix;
})();
