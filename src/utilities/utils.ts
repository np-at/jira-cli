import fs, { PathLike } from 'fs';

import _url from 'url';
import { Response } from 'superagent';

function _loadFromFile(path: PathLike):string {
  return fs.readFileSync(path, 'utf-8');
}

function _isFileExists(path: PathLike): boolean {
  return fs.existsSync(path);
}

function _createDirectory(directory: string): void {
  if (!_isFileExists(directory)) {
    fs.mkdir(directory, function(e) {
      console.log(e);
    });
  }
}

function _saveToFile(path:string, content: string | Uint8Array | Uint8ClampedArray | Uint16Array | Uint32Array | Int8Array | Int16Array | Int32Array | BigUint64Array | BigInt64Array | Float32Array | Float64Array | DataView):void {
  fs.writeFileSync(path, content);
}

function _deleteDirectory(directoryPath:fs.PathLike):void {
  if (fs.existsSync(directoryPath)) {
    fs.rmdirSync(directoryPath);
  }
}

function _deleteFile(pathTofile:fs.PathLike):void {
  if (_isFileExists(pathTofile)) fs.unlinkSync(pathTofile);
}

function _extractErrorMessages(response: string | Response): string[] {
  const { errors, messages } = typeof response === 'string' ? JSON.parse(response).body : response.body;

  function convertErrorsToArray(errors) {
    if (!errors) {
      return [];
    }

    function formatErrorMessage(element) {
      return `${element}: ${errors[element]}`;
    }

    return Object.keys(errors).map(formatErrorMessage);
  }

  return (messages && messages.length) ? messages : convertErrorsToArray(errors);
}

export default  {
  url: _url,
  extractErrorMessages: _extractErrorMessages,
  isFileExists: _isFileExists,
  loadFromFile: _loadFromFile,
  deleteDirectory: _deleteDirectory,
  deleteFile: _deleteFile,
  saveToFile: _saveToFile,
  createDirectory: _createDirectory
};
