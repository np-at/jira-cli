"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = __importDefault(require("path"));
const os_1 = __importDefault(require("os"));
exports.default = (() => {
    const home_directory = os_1.default.homedir();
    const config = {
        directory_name: '.jira-cli',
        config_file_name: 'config.json',
        certificate_file_name: 'jira.crt'
    };
    function _getConfigFilePath() {
        return process.env['JIRA_CONFIG'] || path_1.default.join(_getConfigDirectory(), config.config_file_name);
    }
    function _getCertificateFilePath() {
        return process.env['JIRA_CERT'] || path_1.default.join(_getConfigDirectory(), config.certificate_file_name);
    }
    function _getConfigDirectory() {
        return path_1.default.join(home_directory, config.directory_name);
    }
    return {
        getConfigFilePath: _getConfigFilePath,
        getConfigDirectory: _getConfigDirectory,
        getCertificateFilePath: _getCertificateFilePath
    };
})();
