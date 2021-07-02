import {
  cacheFilePath,
  CacheFileProps,
  fuseIssueIndexOptions,
  fuseIssueIndexPath,
  fuseProjectIndexOptions,
  fuseProjectIndexPath,
  HourMilli
} from './cache';
import fs, { readFileSync } from 'fs';
import { JiraProject } from './PromptHelpers';
import { IssueResponse } from 'jira-connector/types/api';
import { client } from './helpers';
import fuse from 'fuse.js';
import config from '../config';

console.log('refreshing cache projects and issues');
console.time('rf_runner');
const lockFilePath = cacheFilePath + '.lock';
const CacheExpirationThreshold = config.cacheTimeoutThreshold ?? HourMilli;
const currentCache = (): CacheFileProps => {
  try {
    return JSON.parse(readFileSync(cacheFilePath).toString('utf-8'));
  } catch (e) {
    console.error(e);
    return {};
  }
};
const initData = currentCache();

const _flushToDisk = async (newData: CacheFileProps): Promise<void> => {

  // get latest cache object in case it was updated since the refresh cycle was initiated
  const currentData = currentCache();
  Object.assign(currentData, newData);
  await fs.promises.writeFile(cacheFilePath, JSON.stringify(currentData), { encoding: 'utf-8' });
  const issuesIndex = fuse.createIndex(fuseIssueIndexOptions.keys, currentData.issues.value);
  await fs.promises.writeFile(fuseIssueIndexPath, JSON.stringify(issuesIndex.toJSON()));

  const projectIndex = fuse.createIndex(fuseProjectIndexOptions.keys, currentData.projects.value);
  await fs.promises.writeFile(fuseProjectIndexPath, JSON.stringify(projectIndex.toJSON()));
};
const refreshProjects = async (force = false): Promise<void> => {
  if (processLock() === true)
    return;
  else
    processLock(true);
  try {
    const projects: JiraProject[] = [];
    const issues: IssueResponse[] = [];
    if (force || (Date.now() - (initData?.projects?.updated ?? 0)) >= CacheExpirationThreshold) {
      try {
        const response = await client.projects.getAllProjects({ expand: 'issueTypes' });
        projects.push(...response);
      } catch (e) {
        console.error(e);
      }
    }
    if (force || (Date.now() - (initData?.issues?.updated ?? 0)) >= CacheExpirationThreshold) {
      let index = 0;
      while (true) {
        const response = await client.issueSearch.searchForIssuesUsingJqlGet({
          jql: 'Issue IN watchedIssues()',
          startAt: index,
          maxResults: 5000,
          fields: ['*all']
        });
        if (response.issues && response.issues?.length > 0) {
          index = response.startAt + response.issues.length;
          issues.push(...response.issues);
        } else {
          break;
        }

      }
      await _flushToDisk({
        issues: { updated: Date.now(), value: issues },
        projects: { updated: Date.now(), value: projects }
      });
    }
  } catch (e) {
    console.error(e);
  }
  processLock(false);

};
const processLock = (lock?: boolean): boolean => {
  // if @lock param is passed, will toggle the file lock to that state (true/false)
  // else returns whether or not lock is present
  switch (lock) {
    case undefined:
      return !!fs.existsSync(lockFilePath);
    case true:
      fs.writeFileSync(lockFilePath, '{}');
      break;
    case false:
      fs.rmSync(lockFilePath, { maxRetries: 50, recursive: true, retryDelay: 50 });
      break;
    default:
      return false;
  }
  return false;
};

refreshProjects(false).catch(reason => console.error(reason)).finally(() => {
  console.timeEnd('rf_runner');
  processLock(false);
});
