﻿"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.options = exports.edit_meta = exports.default_create = exports.custom_alasql = exports.user_alias = exports.custom_jql = exports.auth = void 0;
exports.auth = {};
exports.custom_jql = {
    reported: 'reporter=currentUser() and status not in (\'Done\')'
};
exports.user_alias = {
    'NICKNAME': 'USERNAME_OF_USER'
};
exports.custom_alasql = {
    'project': 'select fields->project->name , count(1)  AS counter from ? group by fields->project->name',
    'priority': 'select fields->priority->name , count(1)  AS counter from ? group by fields->priority->name',
    'status': 'select fields->project->name,fields->status->name , count(1)  AS counter from ? group by fields->project->name,fields->status->name'
};
exports.default_create = {
    '__always_ask': {
        'fields': {
            'description': {},
            'priority': {}
        }
    },
    'YOUR_ALIAS': {
        'project': 'YOUR_PROJECT',
        'issueType': 3,
        'default': {
            'components': [{
                    'id': '15226'
                }],
            'customfield_12901': 'infrastructure',
            'customfield_12902': {
                'id': '11237'
            }
        }
    }
};
exports.edit_meta = {
    '__default': {
        'wish': {
            'fields': {
                'priority': {
                    'id': '9'
                }
            }
        }
    },
    'sprint': {
        'key': 'customfield_10007'
    },
    'label': {
        'key': 'labels',
        'default': {
            'test1': 't1,t2'
        }
    }
};
exports.options = {
    jira_stop: {
        status: 'To Do'
    },
    jira_start: {
        status: 'In Progress'
    },
    jira_review: {
        status: 'In Review'
    },
    'jira_invalid': {
        'status': 'Invalid'
    },
    jira_done: {
        status: 'Done',
        check_resolution: false
    },
    available_issues_statuses: ['Open', 'In Progress', 'Reopened', 'To Do', 'In Review'],
    use_self_signed_certificate: false
};
