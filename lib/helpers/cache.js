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
exports.fuseProjectIndexOptions = exports.fuseIssueIndexOptions = exports.fuseProjectIndexPath = exports.fuseIssueIndexPath = exports.cacheFilePath = exports.HourMilli = exports.cacheDirectory = void 0;
const settings_1 = __importDefault(require("../settings"));
const path_1 = __importDefault(require("path"));
const utils_1 = __importDefault(require("../utilities/utils"));
const fs = __importStar(require("fs"));
const fs_1 = require("fs");
const child_process_1 = __importDefault(require("child_process"));
const fuse_js_1 = __importDefault(require("fuse.js"));
exports.cacheDirectory = path_1.default.join(settings_1.default.getConfigDirectory(), '.cache');
exports.HourMilli = 3600000;
exports.cacheFilePath = path_1.default.join(exports.cacheDirectory, '.jira-cli-cache.json');
exports.fuseIssueIndexPath = path_1.default.join(exports.cacheDirectory, '.issuesIndex.json');
exports.fuseProjectIndexPath = path_1.default.join(exports.cacheDirectory, '.projectIndex.json');
exports.fuseIssueIndexOptions = {
    keys: ['key', 'fields.summary', 'fields.description'],
    isCaseSensitive: false
};
exports.fuseProjectIndexOptions = {
    keys: ['key'],
    isCaseSensitive: false
};
class CacheObject {
    constructor() {
        this._loadFuseIndices = () => {
            try {
                const issuesIndex = require(exports.fuseIssueIndexPath);
                this._fuseIssueIndex = issuesIndex ? fuse_js_1.default.parseIndex(issuesIndex) : undefined;
            }
            catch {
                if (this._data?.issues?.value)
                    this._fuseIssueIndex = fuse_js_1.default.createIndex(exports.fuseIssueIndexOptions.keys, this._data.issues.value);
            }
            try {
                const projectsIndex = require(exports.fuseProjectIndexPath);
                this._fuseProjectsIndex = projectsIndex ? fuse_js_1.default.parseIndex(projectsIndex) : undefined;
            }
            catch {
                if (this._data?.projects?.value)
                    this._fuseProjectsIndex = fuse_js_1.default.createIndex(exports.fuseProjectIndexOptions.keys, this._data.projects.value);
            }
        };
        try {
            const out = fs.openSync(path_1.default.join(exports.cacheDirectory, 'child_proc.log'), 'a');
            const err = fs.openSync(path_1.default.join(exports.cacheDirectory, 'child_proc_err.log'), 'a');
            const sub = child_process_1.default.fork('refreshRunner', { detached: true, cwd: __dirname, stdio: ['ipc', out, err] });
            sub.unref();
            this._loadFuseIndices();
        }
        catch (e) {
            console.error(e);
        }
    }
    get cacheLoc() {
        return exports.cacheFilePath;
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
    get fuzzyIndexSearch() {
        if (this._fuseIssueIndex && this._data?.issues?.value)
            return new fuse_js_1.default(this._data?.issues?.value, exports.fuseIssueIndexOptions, this._fuseIssueIndex);
        else
            return null;
    }
    get fuzzyProjectSearch() {
        return new fuse_js_1.default(this._data?.projects?.value, {}, this._fuseProjectsIndex);
    }
    get _data() {
        if (this.__data)
            return this.__data;
        else
            return this._load();
    }
    static _ensureCache() {
        try {
            utils_1.default.createDirectory(exports.cacheDirectory);
            if (!utils_1.default.isFileExists(exports.cacheFilePath)) {
                fs_1.writeFileSync(exports.cacheFilePath, '{}', 'utf-8');
            }
        }
        catch (e) {
            console.error('error', e);
        }
    }
    _load() {
        CacheObject._ensureCache();
        this.__data = CacheObject._readCache();
        return this.__data;
    }
    static _readCache() {
        const cachestring = fs_1.readFileSync(exports.cacheFilePath);
        return JSON.parse(cachestring.toString('utf-8'));
    }
}
exports.default = CacheObject;
