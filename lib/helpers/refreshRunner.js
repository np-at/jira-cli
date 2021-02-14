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
exports.refreshProjects = void 0;
const cache_1 = require("./cache");
const fs_1 = __importStar(require("fs"));
const helpers_1 = require("./helpers");
const settings_1 = __importDefault(require("../settings"));
const fuse_js_1 = __importDefault(require("fuse.js"));
const config_1 = __importDefault(require("../config"));
console.log('refreshing cache projects and issues');
console.time('rf_runner');
const lockFilePath = cache_1.cacheFilePath + '.lock';
const CacheExpirationThreshold = config_1.default.cacheTimeoutThreshold ?? cache_1.HourMilli;
const currentCache = () => {
    try {
        return JSON.parse(fs_1.readFileSync(cache_1.cacheFilePath).toString('utf-8'));
    }
    catch (e) {
        console.error(e);
        return {};
    }
};
const initData = currentCache();
const _flushToDisk = async (newData) => {
    settings_1.default.getConfigDirectory();
    const currentData = currentCache();
    Object.assign(currentData, newData);
    await fs_1.default.promises.writeFile(cache_1.cacheFilePath, JSON.stringify(currentData), { encoding: 'utf-8' });
    const issuesIndex = fuse_js_1.default.createIndex(cache_1.fuseIssueIndexOptions.keys, currentData.issues.value);
    await fs_1.default.promises.writeFile(cache_1.fuseIssueIndexPath, JSON.stringify(issuesIndex.toJSON()));
    const projectIndex = fuse_js_1.default.createIndex(cache_1.fuseProjectIndexOptions.keys, currentData.projects.value);
    await fs_1.default.promises.writeFile(cache_1.fuseProjectIndexPath, JSON.stringify(projectIndex.toJSON()));
};
const refreshProjects = async (force = false) => {
    if (processLock() === true)
        return;
    else
        processLock(true);
    try {
        const projects = [];
        const issues = [];
        if (force || (Date.now() - (initData?.projects?.updated ?? 0)) >= CacheExpirationThreshold) {
            try {
                const response = await helpers_1.client.projects.getAllProjects({ expand: 'issueTypes' });
                projects.push(...response);
            }
            catch (e) {
                console.error(e);
                console.log(e);
            }
        }
        if (force || (Date.now() - (initData?.issues?.updated ?? 0)) >= CacheExpirationThreshold) {
            let index = 0;
            while (true) {
                try {
                    const response = await helpers_1.client.issueSearch.searchForIssuesUsingJqlGet({
                        jql: 'Issue IN watchedIssues()',
                        startAt: index,
                        maxResults: 5000,
                        fields: ['*all']
                    });
                    if (response.issues && response.issues?.length > 0) {
                        index = response.startAt + response.issues.length;
                        issues.push(...response.issues);
                    }
                    else
                        break;
                }
                catch (e) {
                    console.error(e);
                    console.log(e);
                    break;
                }
            }
            await _flushToDisk({
                issues: { updated: Date.now(), value: issues },
                projects: { updated: Date.now(), value: projects }
            });
        }
    }
    catch (e) {
        console.error(e);
        console.log(e);
    }
    processLock(false);
};
exports.refreshProjects = refreshProjects;
const processLock = (lock) => {
    switch (lock) {
        case undefined:
            return !!fs_1.default.existsSync(lockFilePath);
        case true:
            fs_1.default.writeFileSync(lockFilePath, '{}');
            break;
        case false:
            fs_1.default.rmSync(lockFilePath, { maxRetries: 50, recursive: true, retryDelay: 50 });
            break;
        default:
            return false;
    }
    return false;
};
try {
    exports.refreshProjects(false).catch(reason => console.error(reason)).finally(() => console.timeEnd('rf_runner'));
}
catch (e) {
    console.error(e);
    console.log(e);
    processLock(false);
}
