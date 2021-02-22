/* eslint-disable prefer-const */
import settings from './settings';
import stripJson from 'strip-json-comments';
import utils from './utilities/utils';

import * as initialConfig from './initial_config';
import { URL } from 'url';
import { RetobImpl } from './Extensions/CommandWComplete';
import auth from './auth';



export interface IConfig {
  use_self_signed_certificate: boolean;
  auth: Auth;
  custom_alasql: Record<string, string>[];
  options: {
    available_issues_statuses: unknown[]
  };
  custom_jql: any;
  edit_meta: any;
  default_create: {
    __always_ask: {
      fields: { [key: string]: string }
    }
  };
  user_alias: any;
  authNew: any,
  cacheTimeoutThreshold?: number,
  user_preferences?: MetaDataObj,
  tree?: RetobImpl
}

interface MetaDataObj {
  [key: string]: unknown
}

interface M {
  key: string,
  value: unknown
}

export interface Auth {
  url?: string,
  user?: string,
  token?: string,
  protocol?: string,
  host?: string
}

let _data: IConfig = undefined;
const configDir = settings.getConfigDirectory();
const configFilePath = settings.getConfigFilePath();

_ensureConfig();

_load();

function _getCreateParams() {
  return Object.entries(_data.default_create.__always_ask.fields);


}

function _ensureConfig(): void {
  utils.createDirectory(configDir);
}

function _update(key: string, value: unknown): void {
  _data[key] = value;
}

function _loadConfigFromFile(configFile, defConfig): IConfig {
  if (utils.isFileExists(configFile)) {
    return _createConfig(utils.loadFromFile(configFile));
  }
  return defConfig;
}

function _loadInitialFromTemplate(template: any): boolean {
  _data = _loadConfigFromFile(template, initialConfig);
  return true;
}

function formatToNewAuth(auth: Auth): Auth {
  const { url, token } = auth;
  if (url) {
    let { host, pathname, protocol } = new URL(url);
    pathname = pathname.endsWith('/') ? pathname.slice(0, pathname.length - 1) : pathname;

    return { host: host + pathname, protocol: protocol, token: token };
  }
  return auth;
}

function _createConfig(configFileContent: string): IConfig {

  const configObject = JSON.parse(stripJson(configFileContent));
  const config: IConfig = {
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
function _load(): boolean {
  _data = _loadConfigFromFile(configFilePath, initialConfig);
  if (!_data?.auth)
    auth.setup({});
  return _isLoaded();
}

function _isLoaded(): boolean {
  return _data.auth.url !== undefined;
}

function _save(): void {
  utils.saveToFile(configFilePath, JSON.stringify(_data, null, 2));
}

function _clear(): void {
  utils.deleteFile(configFilePath);
  utils.deleteDirectory(configDir);
}

class ConfigClass implements IConfig {
  get auth(): Auth {
    return this._auth;
  }

  set auth(value: Auth) {
    this._auth = value;
  }

  constructor(props) {
    _ensureConfig();
    _load();
  }

  ___data: IConfig;
  use_self_signed_certificate: boolean;
  private _auth: Auth;
  custom_alasql: Record<string, string>[];
  options: { available_issues_statuses: unknown[]; };
  custom_jql: any;
  edit_meta: any;
  default_create: { __always_ask: { fields: { [key: string]: string; }; }; };
  user_alias: any;
  authNew: any;
  cacheTimeoutThreshold?: number;
  tree?: RetobImpl;


}



export default {
  save: _save,
  load: _load,
  update: _update,
  clear: _clear,
  loadInitialFromTemplate: _loadInitialFromTemplate,
  isLoaded: _isLoaded,
  default_create: _getCreateParams(),
  ..._data
};
