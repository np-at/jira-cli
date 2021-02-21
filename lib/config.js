"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const settings_1 = __importDefault(require("./settings"));
const strip_json_comments_1 = __importDefault(require("strip-json-comments"));
const utils_1 = __importDefault(require("./utilities/utils"));
const initialConfig = __importStar(require("./initial_config"));
const url_1 = require("url");
const auth_1 = __importDefault(require("./auth"));
let _data = undefined;
const configDir = settings_1.default.getConfigDirectory();
const configFilePath = settings_1.default.getConfigFilePath();
_ensureConfig();
_load();
function _getCreateParams() {
    return Object.entries(_data.default_create.__always_ask.fields);
}
function _ensureConfig() {
    utils_1.default.createDirectory(configDir);
}
function _update(key, value) {
    _data[key] = value;
}
function _loadConfigFromFile(configFile, defConfig) {
    if (utils_1.default.isFileExists(configFile)) {
        return _createConfig(utils_1.default.loadFromFile(configFile));
    }
    return defConfig;
}
function _loadInitialFromTemplate(template) {
    _data = _loadConfigFromFile(template, initialConfig);
    return true;
}
function formatToNewAuth(auth) {
    const { url, token } = auth;
    if (url) {
        let { host, pathname, protocol } = new url_1.URL(url);
        pathname = pathname.endsWith('/') ? pathname.slice(0, pathname.length - 1) : pathname;
        return { host: host + pathname, protocol: protocol, token: token };
    }
    return auth;
}
function _createConfig(configFileContent) {
    const configObject = JSON.parse(strip_json_comments_1.default(configFileContent));
    const config = {
        auth: configObject.auth,
        authNew: formatToNewAuth(configObject.auth),
        options: configObject.options,
        custom_jql: configObject.custom_jql,
        custom_alasql: configObject.custom_alasql,
        user_alias: configObject.user_alias,
        edit_meta: configObject.edit_meta,
        default_create: configObject.default_create,
        use_self_signed_certificate: configObject.use_self_signed_certificate,
        cacheTimeoutThreshold: configObject.cacheTimeoutThreshold
    };
    if (!config.options || !config.options['jira_stop']) {
        console.error('Ops! Seems like your ' + configFilePath + ' is out of date. Please reset you configuration.');
        return;
    }
    return config;
}
function _load() {
    _data = _loadConfigFromFile(configFilePath, initialConfig);
    if (!_data?.auth)
        auth_1.default.setup({});
    return _isLoaded();
}
function _isLoaded() {
    return _data.auth.url !== undefined;
}
function _save() {
    utils_1.default.saveToFile(configFilePath, JSON.stringify(_data, null, 2));
}
function _clear() {
    utils_1.default.deleteFile(configFilePath);
    utils_1.default.deleteDirectory(configDir);
}
exports.default = {
    save: _save,
    load: _load,
    update: _update,
    clear: _clear,
    loadInitialFromTemplate: _loadInitialFromTemplate,
    isLoaded: _isLoaded,
    default_create: _getCreateParams(),
    ..._data
};
