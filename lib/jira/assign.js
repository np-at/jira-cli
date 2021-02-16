"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ssl_request_1 = __importDefault(require("../ssl_request"));
const utils_1 = __importDefault(require("../utilities/utils"));
const config_1 = __importDefault(require("../config"));
function assign() {
    const assign = {
        query: null,
        table: null,
        to(ticket, assignee) {
            this.query = 'rest/api/2/issue/' + ticket + '/assignee';
            ssl_request_1.default
                .put(config_1.default.auth.url + this.query)
                .send({ 'name': assignee })
                .set('Content-Type', 'application/json')
                .set('Authorization', 'Basic ' + config_1.default.auth.token)
                .end((err, res) => {
                if (!res.ok) {
                    const errorMessages = utils_1.default.extractErrorMessages(res).join('\n');
                    return console.log(errorMessages);
                }
                return console.log('Issue [' + ticket + '] assigned to ' + assignee + '.');
            });
        },
        me: function (ticket) {
            this.to(ticket, config_1.default.auth.user);
        }
    };
    return assign;
}
exports.default = assign;
