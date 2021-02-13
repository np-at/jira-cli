import settings from '../settings';
import path from 'path';
import utils from '../utils';
import * as fs from 'fs';
import { readFileSync, writeFileSync } from 'fs';
import { JiraIssueType, JiraProject } from './PromptHelpers';
import { IssueResponse } from 'jira-connector/types/api';
import { client } from './helpers';

const HourMilli = 3600000;
const cacheFileName = '.jira-cli-cache.json';


interface LastUsedEntry {
  project?: JiraProject;
  issueType?: JiraIssueType;
  issue?: IssueResponse;
  epic?: IssueResponse;
}

export interface CacheProps {
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
    return this._cacheLoc;
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

  private _cacheLoc?: string;
  private _data?: CacheProps;
  private get data() {
    return this._data;
  }

  constructor() {
    // load cache into memory on startup, add hook to flush results to file on stop
    this._load();
    // process.addListener('beforeExit', this._flushToDisk);
    this._refreshProjects().catch(reason => console.error(reason));

  }
  private _flushToDisk(..._args): void {
    const cacheLoc = path.join(settings.getConfigDirectory(), cacheFileName);
    const currentCache = (() => {
      const cachestring = readFileSync(cacheLoc);
      return JSON.parse(cachestring.toString('utf-8'));
    })();

    Object.assign(currentCache, this.data);
    fs.writeFileSync(cacheLoc, JSON.stringify(currentCache), { encoding: 'utf-8' });
  }
  private _ensureCache() {

    try {
      this._cacheLoc = path.join(settings.getConfigDirectory(), cacheFileName);
      if (!utils.isFileExists(this._cacheLoc)) {
        writeFileSync(this._cacheLoc, '{}', 'utf-8');
      }
      return this._cacheLoc;
    } catch (e) {
      console.error('error', e);
    }

  }

  private _load() {
    this._ensureCache();
    this._data = this._readCache();
  }

  private async _refreshProjects(force = false): Promise<void> {
    console.time('refreshtimer');
    if (force || (Date.now() - (this._data?.projects?.updated ?? 0)) >= HourMilli) {
      try {
        this.projects = await client.projects.getAllProjects({ expand: 'issueTypes' });
      } catch (e) {
        console.error(e);
      }
    }
    if (force || (Date.now() - (this._data?.issues?.updated ?? 0)) >= HourMilli) {
      let index = 0;
      const col = [];
      while (true) {
        try {
          const response = await client.issueSearch.searchForIssuesUsingJqlGet({ startAt: index, maxResults: 5000 });
          if (response.issues && response.issues.length > 0) {
            index = response.startAt + response.issues.length;
            col.push(...response.issues);
          } else
            break;
        } catch (e) {
          console.error(e);
          break;
        }

      }
      this.issues = col;
      this._flushToDisk();
      console.timeEnd('refreshtimer');
    }
  }

  private _readCache(): CacheProps {
    // return data if already loaded, if not, then load it
    if (this._data !== null && this._data !== undefined) return this._data;
    const cachestring = readFileSync(this._cacheLoc);
    return JSON.parse(cachestring.toString('utf-8'));
  }

  // public async get(): Promise<CacheProps> {
  //   try {
  //     return this._readCache();
  //   } catch (e) {
  //     console.error('error while fetching cache', e);
  //   }
  // }

  // public async set(props: CacheProps): Promise<CacheProps> {
  //   const currentCache = await this._readCache();
  //   Object.assign(currentCache, props);
  //   await writeFile(this._cacheLoc, JSON.stringify(currentCache), { encoding: 'utf-8' });
  //   return currentCache;
  // }

}
