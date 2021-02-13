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
const fs_1 = require("fs");
const helpers_1 = require("./helpers");
const HourMilli = 3600000;
const cacheFileName = '.jira-cli-cache.json';
class CacheObject {
    constructor() {
        this._load();
        this._refreshProjects().catch(reason => console.error(reason));
    }
    get cacheLoc() {
        return this._cacheLoc;
    }
    get issues() {
        return this._data.issues.value;
    }
    set issues(issueResponses) {
        this._data.issues = { updated: Date.now(), value: issueResponses };
    }
    get projects() {
        return this._data.projects.value;
    }
    set projects(projects) {
        this._data.projects = { updated: Date.now(), value: projects };
    }
    get recent() {
        return this._data.recent.value;
    }
    set recent(entry) {
        this._data.recent = { updated: Date.now(), value: entry };
    }
    get data() {
        return this._data;
    }
    _flushToDisk(..._args) {
        const cacheLoc = path_1.default.join(settings_1.default.getConfigDirectory(), cacheFileName);
        const currentCache = (() => {
            const cachestring = fs_1.readFileSync(cacheLoc);
            return JSON.parse(cachestring.toString('utf-8'));
        })();
        Object.assign(currentCache, this.data);
        fs.writeFileSync(cacheLoc, JSON.stringify(currentCache), { encoding: 'utf-8' });
    }
    _ensureCache() {
        try {
            this._cacheLoc = path_1.default.join(settings_1.default.getConfigDirectory(), cacheFileName);
            if (!utils_1.default.isFileExists(this._cacheLoc)) {
                fs_1.writeFileSync(this._cacheLoc, '{}', 'utf-8');
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
    async _refreshProjects(force = false) {
        console.time('refreshtimer');
        if (force || (Date.now() - (this._data?.projects?.updated ?? 0)) >= HourMilli) {
            try {
                this.projects = await helpers_1.client.projects.getAllProjects({ expand: 'issueTypes' });
            }
            catch (e) {
                console.error(e);
            }
        }
        if (force || (Date.now() - (this._data?.issues?.updated ?? 0)) >= HourMilli) {
            let index = 0;
            const col = [];
            while (true) {
                try {
                    const response = await helpers_1.client.issueSearch.searchForIssuesUsingJqlGet({ startAt: index, maxResults: 5000 });
                    if (response.issues && response.issues.length > 0) {
                        index = response.startAt + response.issues.length;
                        col.push(...response.issues);
                    }
                    else
                        break;
                }
                catch (e) {
                    console.error(e);
                    break;
                }
            }
            this.issues = col;
            this._flushToDisk();
            console.timeEnd('refreshtimer');
        }
    }
    _readCache() {
        if (this._data !== null && this._data !== undefined)
            return this._data;
        const cachestring = fs_1.readFileSync(this._cacheLoc);
        return JSON.parse(cachestring.toString('utf-8'));
    }
}
exports.default = CacheObject;
