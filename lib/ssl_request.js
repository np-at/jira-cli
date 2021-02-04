"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = __importDefault(require("./config"));
const superagent_1 = __importDefault(require("superagent"));
const ca_1 = __importDefault(require("./ca"));
exports.default = (() => {
    const _buildRequest = (verb) => {
        if (config_1.default.use_self_signed_certificate) {
            return argument => superagent_1.default[verb](argument)
                .ca(ca_1.default())
                .set('Content-Type', 'application/json')
                .set('Authorization', 'Basic ' + config_1.default.auth.token);
        }
        else {
            return (argument) => superagent_1.default[verb](argument)
                .set('Content-Type', 'application/json')
                .set('Authorization', 'Basic ' + config_1.default.auth.token);
        }
    };
    return {
        get: _buildRequest('get'),
        post: _buildRequest('post'),
        put: _buildRequest('put'),
        delete: _buildRequest('delete')
    };
})();
