"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/*global requirejs,console,define,fs*/
const ssl_request_1 = __importDefault(require("../ssl_request"));
const cli_table_1 = __importDefault(require("cli-table"));
const config_1 = __importDefault(require("../config"));
exports.default = (() => {
    const getRapidBoardID = (rapidBoardID, cb) => {
        if (typeof rapidBoardID !== 'string') {
            rapidBoardID = undefined;
        }
        ssl_request_1.default.get(config_1.default.auth.url + 'rest/greenhopper/latest/rapidviews/list').end((err, res) => {
            if (!res.ok) {
                console.log('Error getting rapid boards. HTTP Status Code: ' + res.status);
                return;
            }
            displayRapidBoards(rapidBoardID, res.body, cb);
        });
    };
    const displayRapidBoards = (rapidBoardID, data, cb) => {
        const table = new cli_table_1.default({
            head: ['Key', 'Name']
        });
        let pushTable = [];
        for (let i = 0; i < data.views.length; i++) {
            const item = data.views[i];
            if (rapidBoardID !== undefined) {
                if (item.name.toLowerCase() === rapidBoardID.toLowerCase()) {
                    pushTable = [[item.id, item.name]];
                    break;
                }
                if (item.name.toLowerCase().indexOf(rapidBoardID.toLowerCase()) === -1) {
                    continue;
                }
            }
            pushTable.push([item.id, item.name]);
        }
        table.push(...table, ...pushTable);
        if (table.length === 0) {
            if (rapidBoardID === undefined) {
                console.log('No rapid boards found in your Jira instance');
            }
            else {
                console.log('No rapid boards found matching term in your Jira instance: ' + rapidBoardID);
            }
        }
        else if (table.length === 1) {
            console.log('****Found Rapid Board: ' + table[0][1]);
            cb(table[0][0]);
        }
        else {
            console.log('\nMatching Rapid Boards:');
            console.log('=========================================\n');
            console.log(table.toString());
        }
    };
    const getSprintID = function getSprintID(rapidBoardID, sprintID, cb) {
        if (typeof sprintID !== 'string') {
            sprintID = undefined;
        }
        ssl_request_1.default.get(config_1.default.auth.url + 'rest/greenhopper/latest/sprintquery/' + rapidBoardID).end((err, res) => {
            if (!res.ok) {
                console.log('Error getting sprints. HTTP Status Code: ' + res.status);
                return;
            }
            displaySprints(rapidBoardID, sprintID, res.body, cb);
        });
    };
    const displaySprints = (rapidBoardID, sprintID, data, cb) => {
        const table = new cli_table_1.default({
            head: ['Key', 'Name', 'Status']
        });
        let pushTable = [];
        for (let i = 0; i < data.sprints.length; i++) {
            const item = data.sprints[i];
            if (sprintID !== undefined) {
                if (item.name.toLowerCase() === sprintID.toLowerCase()) {
                    pushTable = [[item.id, item.name, item.state]];
                    break;
                }
                if (item.state !== 'ACTIVE') {
                    continue;
                }
                if (item.name.toLowerCase().indexOf(sprintID.toLowerCase()) === -1) {
                    continue;
                }
            }
            pushTable.push([item.id, item.name, item.state]);
        }
        table.push(...table, ...pushTable);
        if (table.length === 0) {
            if (sprintID === undefined) {
                console.log('No sprints found in rapid board ' + rapidBoardID);
            }
            else {
                console.log('No sprints found matching term in rapid board ' + rapidBoardID + ': ' + sprintID);
            }
        }
        else if (table.length === 1) {
            console.log('****Found Sprint: ' + table[0][1]);
            cb(table[0][0]);
        }
        else {
            console.log('\nMatching Sprints:');
            console.log('=========================================\n');
            console.log(table.toString());
            return cb(pushTable[pushTable.length - 1][0], pushTable); //picks the last sprint
        }
    };
    const getSprintIssues = function getSprintIssues(rapidBoardID, sprintID, cb) {
        let qParams = 'rapidViewId=' + rapidBoardID;
        if (sprintID) {
            qParams += '&sprintId=' + sprintID;
        }
        ssl_request_1.default.get(config_1.default.auth.url + 'rest/greenhopper/latest/rapid/charts/sprintreport?' + qParams).end((err, res) => {
            if (!res.ok) {
                console.log('Error getting sprint data. HTTP Status Code: ' + res.status);
                console.dir(res.body);
                return;
            }
            cb(res.body);
        });
    };
    const displaySprintIssues = function displaySprintIssues(rapidBoardID, sprintID, data) {
        const sprint = new cli_table_1.default({
            head: ['Key', 'Name', 'Status', 'Start Date', 'End Date']
        });
        const completed = new cli_table_1.default({
            head: ['Key', 'Type', 'Assignee', 'Priority', 'Status', 'Summary']
        });
        const incompleted = new cli_table_1.default({
            head: ['Key', 'Type', 'Assignee', 'Priority', 'Status', 'Summary']
        });
        const punted = new cli_table_1.default({
            head: ['Key', 'Type', 'Assignee', 'Priority', 'Status', 'Summary']
        });
        const pushIssues = function pushIssues(issues, table) {
            if (!issues)
                return;
            issues.forEach(function (issue) {
                const priority = issue.priorityName || 'Unknown', summary = issue.summary.length > 45 ? issue.summary.substr(0, 42) + '...' : issue.summary, status = issue.statusName || 'Unknown', assignee = issue.assignee || 'None', key = issue.key || 'Unknown', type = issue.typeName || 'Unknown';
                table.push([key, type, assignee, priority, status, summary]);
            });
        };
        pushIssues(data.contents.completedIssues, completed);
        pushIssues(data.contents.issuesNotCompletedInCurrentSprint, incompleted);
        pushIssues(data.contents.puntedIssues, punted);
        sprint.push([data.sprint.id, data.sprint.name, data.sprint.state, data.sprint.startDate, data.sprint.endDate]);
        const displayTable = function displayTable(msg, table) {
            if (table.length > 0) {
                console.log(msg);
                console.log(table.toString());
                console.log('\n==============================================================\n');
            }
        };
        console.log('\n==============================================================');
        console.log('====                        SPRINT                        ====');
        console.log('==============================================================\n');
        displayTable('Sprint:', sprint);
        displayTable('Completed Issues:', completed);
        displayTable('Punted Issues:', punted);
        displayTable('Incompleted Issues:', incompleted);
    };
    return function sprint(userRapidBoardID, userSprintID, cb) {
        getRapidBoardID(userRapidBoardID, function (rapidBoardID) {
            getSprintID(rapidBoardID, userSprintID, function (sprintID, allSprints) {
                getSprintIssues(rapidBoardID, sprintID, function (data) {
                    if (cb) {
                        displaySprintIssues(rapidBoardID, sprintID, data);
                        return cb(allSprints);
                    }
                    else {
                        displaySprintIssues(rapidBoardID, sprintID, data);
                    }
                });
            });
        });
    };
})();
