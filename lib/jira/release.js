"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ssl_request_1 = __importDefault(require("../ssl_request"));
const moment_1 = __importDefault(require("moment"));
const config_1 = __importDefault(require("../config"));
exports.default = (() => {
    const release = {
        query: null,
        table: null,
        create: function (version, options) {
            this.query = 'rest/api/2/version';
            const releaseDate = moment_1.default().format('YYYY-MM-DD');
            ssl_request_1.default.post(config_1.default.auth.url + this.query).send({
                'name': version,
                'project': options.project,
                'released': options.released,
                'releaseDate': releaseDate,
                'description': options.description
            }).end((err, res) => {
                if (!res.ok) {
                    return console.log((res.body.errorMessages || [res.error]).join('\n'));
                }
                console.log('ReleaseId=' + res.body.id);
                console.log('ProjectId=' + res.body.projectId);
                return;
            });
        }
    };
    return release;
})();
