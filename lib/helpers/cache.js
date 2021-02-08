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
const settings_1 = __importDefault(require("../settings"));
const path_1 = __importDefault(require("path"));
const utils_1 = __importDefault(require("../utils"));
const fs = __importStar(require("fs"));
const cacheFileName = '.jira-cli-cache.json';
function _ensureCache() {
    const cacheLocation = path_1.default.join(settings_1.default.getConfigDirectory(), cacheFileName);
    if (!utils_1.default.isFileExists(cacheLocation)) {
        fs.writeFile(cacheLocation, '{}', (err) => console.error(err));
    }
    return cacheLocation;
}
class CacheObject {
    constructor() {
        this._cacheLoc = _ensureCache();
    }
    async _readCache() {
        const cachestring = await fs.promises.readFile(this._cacheLoc);
        return JSON.parse(cachestring.toString('utf-8'));
    }
    async get() {
        return await this._readCache();
    }
}
