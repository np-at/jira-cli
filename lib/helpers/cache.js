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
class CacheObject {
    constructor() {
        this._load();
    }
    _ensureCache() {
        try {
            this._cacheLoc = path_1.default.join(settings_1.default.getConfigDirectory(), cacheFileName);
            if (!utils_1.default.isFileExists(this._cacheLoc)) {
                fs.writeFileSync(this._cacheLoc, '{}', 'utf-8');
            }
            return this._cacheLoc;
        }
        catch (e) {
            console.error('error', e);
        }
    }
    _load() {
        this._ensureCache();
        this._data = this._readCache();
    }
    _readCache() {
        // return data if already loaded, if not, then load it
        if (this._data !== null && this._data !== undefined)
            return this._data;
        const cachestring = fs.readFileSync(this._cacheLoc);
        return JSON.parse(cachestring.toString('utf-8'));
    }
    async get() {
        try {
            return this._readCache();
        }
        catch (e) {
            console.error('error while fetching cache', e);
        }
    }
    async set(props) {
        const currentCache = await this._readCache();
        Object.assign(currentCache, props);
        await fs.promises.writeFile(this._cacheLoc, JSON.stringify(currentCache), { encoding: 'utf-8' });
        return currentCache;
    }
}
exports.default = CacheObject;
