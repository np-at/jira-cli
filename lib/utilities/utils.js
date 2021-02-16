"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const url_1 = __importDefault(require("url"));
function _loadFromFile(path) {
    return fs_1.default.readFileSync(path, 'utf-8');
}
function _isFileExists(path) {
    return fs_1.default.existsSync(path);
}
function _createDirectory(directory) {
    if (!_isFileExists(directory)) {
        fs_1.default.mkdir(directory, function (e) {
            console.log(e);
        });
    }
}
function _saveToFile(path, content) {
    fs_1.default.writeFileSync(path, content);
}
function _deleteDirectory(directoryPath) {
    if (fs_1.default.existsSync(directoryPath)) {
        fs_1.default.rmdirSync(directoryPath);
    }
}
function _deleteFile(pathTofile) {
    if (_isFileExists(pathTofile))
        fs_1.default.unlinkSync(pathTofile);
}
function _extractErrorMessages(response) {
    const { errors, messages } = typeof response === 'string' ? JSON.parse(response).body : response.body;
    function convertErrorsToArray(errors) {
        if (!errors) {
            return [];
        }
        function formatErrorMessage(element) {
            return `${element}: ${errors[element]}`;
        }
        return Object.keys(errors).map(formatErrorMessage);
    }
    return (messages && messages.length) ? messages : convertErrorsToArray(errors);
}
exports.default = {
    url: url_1.default,
    extractErrorMessages: _extractErrorMessages,
    isFileExists: _isFileExists,
    loadFromFile: _loadFromFile,
    deleteDirectory: _deleteDirectory,
    deleteFile: _deleteFile,
    saveToFile: _saveToFile,
    createDirectory: _createDirectory
};
