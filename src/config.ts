/* eslint-disable prefer-const */
import settings from './settings';
import stripJson from 'strip-json-comments';
import utils from './utils';

import * as initialConfig from './initial_config';
import { URL } from 'url';

export interface IConfig {
  use_self_signed_certificate: boolean;
  auth: Auth;
  custom_alasql: Record<string, string>[];
  options: {
    available_issues_statuses: unknown[]
  };
  custom_jql: any;
  edit_meta: any;
  default_create: any;
  user_alias: any;
  authNew: any
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


function _ensureConfig(): void {
  utils.createDirectory(configDir);
}

function _update(key:string, value:unknown): void {
  _data[key] = value;
}

function _loadConfigFromFile(configFile, defConfig): IConfig {
  if (utils.isFileExists(configFile)) {
    return _createConfig(utils.loadFromFile(configFile));
  }
  return defConfig;
}

function _loadInitialFromTemplate(template): boolean {
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

function _createConfig(configFileContent: string):  IConfig {
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
    use_self_signed_certificate: configObject.use_self_signed_certificate
  };

  if (!config.options || !config.options['jira_stop']) {
    console.error('Ops! Seems like your ' + configFilePath + ' is out of date. Please reset you configuration.');
    return;
  }

  return config;
}

function _load(): boolean {
  _data = _loadConfigFromFile(configFilePath, initialConfig);
  return _isLoaded();
}

function _isLoaded(): boolean {
  return _data.auth.url !== undefined;
}

function _save(): void {
  utils.saveToFile(configFilePath, JSON.stringify(_data, null, 2));
}

function _clear():void {
  utils.deleteFile(configFilePath);
  utils.deleteDirectory(configDir);
}


export default {
  save: _save,
  load: _load,
  update: _update,
  clear: _clear,
  loadInitialFromTemplate: _loadInitialFromTemplate,
  isLoaded: _isLoaded,
  ..._data
};
