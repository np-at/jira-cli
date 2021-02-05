import settings from '../settings';
import path from 'path';
import utils from '../utils';
import * as fs from 'fs';


const cacheFileName = '.jira-cli-cache.json';

function _ensureCache() {
  const cacheLocation = path.join(settings.getConfigDirectory(), cacheFileName);
  if (!utils.isFileExists(cacheLocation)) {
    fs.writeFile(cacheLocation, '{}', (err) => console.error(err));
  }
  return cacheLocation;

}

class CacheObject {

  _cacheLoc: string;

  constructor() {
    this._cacheLoc = _ensureCache();
  }

  private async _readCache() {
    const cachestring = await fs.promises.readFile(this._cacheLoc);
    return JSON.parse(cachestring.toString('utf-8'));
  }
  public async get() {
    return await this._readCache();
  }
}
