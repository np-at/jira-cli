import path from 'path';
import os from 'os';


const home_directory = os.homedir();
const config = {
  directory_name: '.jira-cli',
  config_file_name: 'config.json',
  certificate_file_name: 'jira.crt'
};

function _getConfigFilePath(): string {
  return process.env['JIRA_CONFIG'] || path.join(_getConfigDirectory(), config.config_file_name);
}

function _getCertificateFilePath(): string {
  return process.env['JIRA_CERT'] || path.join(_getConfigDirectory(), config.certificate_file_name);
}

function _getConfigDirectory(): string {
  return path.join(home_directory, config.directory_name);
}

export default {
  getConfigFilePath: _getConfigFilePath,
  getConfigDirectory: _getConfigDirectory,
  getCertificateFilePath: _getCertificateFilePath
};
