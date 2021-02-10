import settings from '../settings';
import path from 'path';
import utils from '../utils';
import * as fs from 'fs';
import { JiraIssueType, JiraProject } from './DynamicPrompt';
import { IssueResponse } from 'jira-connector/types/api';


export interface CacheProps {
  recent?: {
    project?: JiraProject,
    issueType?: JiraIssueType,
    issue?: IssueResponse,
    epic?: IssueResponse
  }
}


const cacheFileName = '.jira-cli-cache.json';


export default class CacheObject {

  _cacheLoc?: string;
  private _data?: CacheProps;

  constructor() {
    this._load();
  }

  private _ensureCache() {

    try {
      this._cacheLoc = path.join(settings.getConfigDirectory(), cacheFileName);
      if (!utils.isFileExists(this._cacheLoc)) {
        fs.writeFileSync(this._cacheLoc, '{}', 'utf-8');
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

  private _readCache(): CacheProps {
    // return data if already loaded, if not, then load it
    if (this._data !== null && this._data !== undefined) return this._data;
    const cachestring = fs.readFileSync(this._cacheLoc);
    return JSON.parse(cachestring.toString('utf-8'));
  }

  public async get(): Promise<CacheProps> {
    try {
      return this._readCache();
    } catch (e) {
      console.error('error while fetching cache', e);
    }
  }

  public async set(props: CacheProps): Promise<CacheProps> {
    const currentCache = await this._readCache();
    Object.assign(currentCache, props);
    await fs.promises.writeFile(this._cacheLoc, JSON.stringify(currentCache), { encoding: 'utf-8' });
    return currentCache;
  }
}
