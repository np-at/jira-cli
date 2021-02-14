import settings from '../settings';
import path from 'path';
import utils from '../utils';
import * as fs from 'fs';
import { readFileSync, writeFileSync } from 'fs';
import { JiraIssueType, JiraProject } from './PromptHelpers';
import { IssueResponse } from 'jira-connector/types/api';

import cp from 'child_process';
import Fuse from 'fuse.js';
import FuseIndex = Fuse.FuseIndex;
import IFuseOptions = Fuse.IFuseOptions;

export const cacheDirectory = path.join(settings.getConfigDirectory(), '.cache');

export const HourMilli = 3600000;
export const cacheFilePath = path.join(cacheDirectory, '.jira-cli-cache.json');
export const fuseIssueIndexPath = path.join(cacheDirectory, '.issuesIndex.json');
export const fuseProjectIndexPath = path.join(cacheDirectory, '.projectIndex.json');

export const fuseIssueIndexOptions: IFuseOptions<IssueResponse> = {
  keys: ['key', 'fields.summary', 'fields.description'],
  isCaseSensitive: false
};
export const fuseProjectIndexOptions: IFuseOptions<IssueResponse> = {
  keys: ['key'],
  isCaseSensitive: false
};

interface LastUsedEntry {
  project?: JiraProject;
  issueType?: JiraIssueType;
  issue?: IssueResponse;
  epic?: IssueResponse;
}

export interface CacheFileProps {
  recent?: CacheEntry<LastUsedEntry>,
  issues?: CacheEntry<IssueResponse[]>,
  projects?: CacheEntry<JiraProject[]>
}

interface CacheEntry<T> {
  updated: number,
  value: T
}

export default class CacheObject {
  get cacheLoc(): string {
    return cacheFilePath;
  }

  get issues(): IssueResponse[] {
    return this._data.issues.value;
  }

  set issues(issueResponses: IssueResponse[]) {
    this._data.issues = { updated: Date.now(), value: issueResponses };
  }

  get projects(): JiraProject[] {
    return this._data.projects.value;
  }

  set projects(projects: JiraProject[]) {
    this._data.projects = { updated: Date.now(), value: projects };
  }

  get recent(): LastUsedEntry {
    return this._data.recent.value;
  }

  set recent(entry: LastUsedEntry) {
    this._data.recent = { updated: Date.now(), value: entry };
  }


  private __data?: CacheFileProps;
  private _fuseProjectsIndex?: Fuse.FuseIndex<JiraProject>;
  private _fuseIssueIndex?: FuseIndex<IssueResponse>;

  public get fuzzyIndexSearch(): Fuse<IssueResponse> | null {
    if (this._fuseIssueIndex && this._data?.issues?.value)
      return new Fuse(this._data?.issues?.value, fuseIssueIndexOptions, this._fuseIssueIndex);
    else
      return null;
  }

  public get fuzzyProjectSearch(): Fuse<JiraProject> {
    return new Fuse(this._data?.projects?.value, {}, this._fuseProjectsIndex);
  }

  private get _data() {
    if (this.__data)
      return this.__data;
    else
      return this._load();
  }

  constructor() {
    // load cache into memory on startup, add hook to flush results to file on stop
    try {
      const out = fs.openSync(path.join(cacheDirectory, 'child_proc.log'), 'a');
      const err = fs.openSync(path.join(cacheDirectory, 'child_proc_err.log'), 'a');
      const sub = cp.fork('refreshRunner', { detached: true, cwd: __dirname, stdio: ['ipc', out, err] });
      sub.unref();
      this._loadFuseIndices();
    } catch (e) {
      console.error(e);
    }

  }

  private _loadFuseIndices = (): void => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const issuesIndex = require(fuseIssueIndexPath);
      this._fuseIssueIndex = issuesIndex ? Fuse.parseIndex<IssueResponse>(issuesIndex) : undefined;
    } catch {
      if (this._data?.issues?.value)
        this._fuseIssueIndex = Fuse.createIndex(fuseIssueIndexOptions.keys, this._data.issues.value);
    }
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const projectsIndex = require(fuseProjectIndexPath);
      this._fuseProjectsIndex = projectsIndex ? Fuse.parseIndex<JiraProject>(projectsIndex) : undefined;
    } catch {
      if (this._data?.projects?.value)
        this._fuseProjectsIndex = Fuse.createIndex(fuseProjectIndexOptions.keys, this._data.projects.value);
    }
  };

  private static _ensureCache() {

    try {
      utils.createDirectory(cacheDirectory);
      if (!utils.isFileExists(cacheFilePath)) {
        writeFileSync(cacheFilePath, '{}', 'utf-8');
      }
    } catch (e) {
      console.error('error', e);
    }

  }

  private _load(): CacheFileProps {
    CacheObject._ensureCache();
    this.__data = CacheObject._readCache();
    return this.__data;
  }


  private static _readCache(): CacheFileProps {
    // return data if already loaded, if not, then load it
    const cachestring: Buffer = readFileSync(cacheFilePath);
    return JSON.parse(cachestring.toString('utf-8'));
  }

  // public async get(): Promise<CacheFileProps> {
  //   try {
  //     return this._readCache();
  //   } catch (e) {
  //     console.error('error while fetching cache', e);
  //   }
  // }

  // public async set(props: CacheFileProps): Promise<CacheFileProps> {
  //   const currentCache = await this._readCache();
  //   Object.assign(currentCache, props);
  //   await writeFile(cacheFilePath, JSON.stringify(currentCache), { encoding: 'utf-8' });
  //   return currentCache;
  // }

}
