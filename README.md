jira-cli
========

[![NPM Version](https://badge.fury.io/js/jira-cli.svg)](https://npmjs.org/package/jira-cli)
[![Package downloads](http://img.shields.io/npm/dm/jira-cli.svg)](https://npmjs.org/package/jira-cli)
[Jira API Reference](https://docs.atlassian.com/software/jira/docs/api/REST/8.1.0/)

A Jira command line interface (forked from https://github.com/germanrcuriel/jira-cmd )

- Tested Features: (see bin/tests.sh --these all work)
  * Show issues assigned to you.
  * Execute custom JQL
  * Create an issue
  * Create an issue from a template
  * Configure project specific issue transitions
  * Use project specific default config files -helps other developers get up to speed faster on a project
  * Create releases
  * Send release reports via gmail
  * Assign fix version to an issue

- TODO - Untested Features:
  * Use jql shortcuts
  * Show sprint information
  * Add an issue to a sprint
  * Add multiple issues to a sprint in one command
  * Use user shortcuts/aliases

## Installation

Install [node.js](http://nodejs.org/).

Then, in your shell type:

    $ npm install -g jira-cli

##### Help

  Many of the commands have "sub" helps to them so if you supply the -h with the command you will see a more complete help than what is printed by the global help below.
  For example:

  ```
    $ jira config -h

      Usage: config [options]

      Options:

        -h, --help                 output usage information
        -c, --clear                Clear stored configuration
        -t, --template <template>  Start config with this given template
        -v, --verbose              verbose debugging output

      Config Help:

        Jira URL: https://foo.atlassian.net/
        Username: user (for user@foo.bar)
        Password: Your password

      WARNING:After three failed login attempts Atlassian forces a CAPTCHA login
      WARNING:  which can only be done via the browser.
    ```

  The general help is: `jira -h`

  ```
  Usage: jira.js [options] [command]

  Commands:

    ls [options]           List my issues
    start <issue>          Start working on an issue.
    stop <issue>           Stop working on an issue.
    review <issue> [assignee] Mark issue as being reviewed [by assignee(optional)].
    done [options] <issue> Mark issue as finished.
    invalid <issue>        Mark issue as finished.
    mark <issue>           Mark issue as.
    edit <issue> [input]   edit issue.
    running                List issues in progress.
    jql [options] [query]  Run JQL query
    link <from> <to> [link_value] link issues
    search <term>          Find issues.
    assign <issue> [user]  Assign an issue to <user>. Provide only issue# to assign to me
    watch <issue> [user]   Watch an issue to <user>. Provide only issue# to watch to me
    comment <issue> [text] Comment an issue.
    show [options] <issue> Show info about an issue
    open <issue>           Open an issue in a browser
    worklog <issue>        Show worklog about an issue
    worklogadd [options] <issue> <timeSpent> [comment] Log work for an issue
    create [options] [project[-issue]] Create an issue or a sub-task
    new [options] [key]    Create an issue or a sub-task
    config [options]       Change configuration
    sprint [options]       Works with sprint boards
                                With no arguments, displays all rapid boards
                                With -r argument, attempt to find a single rapid board
                                and display its active sprints
                                With both -r and -s arguments
                                attempt to get a single rapidboard/ sprint and show its issues. If
                                a single sprint board isnt found, show all matching sprint boards

    fix [options] <issue> <version> Set FixVersion of an issue to <version>.
    release [options] <version> Create a FixVersion/Release (see release -h for more details)
    send [options]         Send email report (see send -h for more details)

    Options:

    -h, --help     output usage information
    -V, --version  output the version number

    ```

## Configuration Setup (Do this first)

    ```
    $ jira config
    Jira URL: https://jira.atlassian.com/
    Username: xxxxxx
    Password: xxxxxx
    Information stored!
    ```

  This saves your credentials (base64 encoded), and a default working configuration file in your current working directory+ `/.jira-cli`.

  You can also set an environment variable called `JIRA_CONFIG=/path/to/your/file/config.json`  which the script will use instead of the default current diretory.

## Configuration Templates

By default the script uses a default configuration that needs to be adjusted to your workflows, issue transitions, and project names.  However, if another developer has preconfigured
a config file you can use that file as your starting point so your configuration is all setup except for your url, username and password.  Do this with the -t  option.

  ```
  $ jira config -t /some/network/path/my_awesome_project_setup_for_me.json
    Jira URL: https://jira.atlassian.com/
    Username: xxxxxx
    Password: xxxxxx
    Information stored!
  ```

### Create a jira issue

	Usage: create [options] [project[-issue]]
		Options:

		-h, --help                      output usage information
		-p, --project <project>         Rapid board on which project is to be created
		-P, --priority <priority>       priority of the issue
		-T --type <type>                Issue type
		-s --subtask <subtask>          Issue subtask
		-t --title <title>              Issue title
		-d --details <details>  Issue details
		-a --assignee <assignee>        Issue assignee


### Using jira issue templates
#### What does jira new offers
  * if you make issues very frequently then you can save multiple templates of default values with a key to call with in ~/jira/config.json . then you just have to do <kbd>jira new KEY1</kbd>
	*

``` json
    "default_create" : {
	<!-- fields which you want to prompt every time  -->
	<!-- whenever you create a new issue -->
	"__always_ask" :{
	    "fields" :{
		"details" :{}, <!-- details would be prompted everytime -->
		"priority": {}	   <!-- priority would be prompted every time -->
	    }
	},
	<!-- you will do jira new KEY1 to use this template of default values -->
	"KEY1" : {
	    "project": "YOUR_PROJECT", <!-- mandatory -->
	    "issueType": 3,			   <!-- mandatory -->
	    "default" : {
			"components": [{
				"id": "15226"
			}],
			"customfield_12901" : "infrastructure",
			"customfield_10008" : "MDO-9584",
			"customfield_12902": {
				"id": "11237"
			},
			<!-- in this case, this customfield corresponds to cc-->
			<!-- , so when creating new jira with this template-->
			<!-- every iissue would have username prakhar in cc-->
			"customfield_10901": [{ <!-- how to give usernames -->
				"name": "prakhar"
			}]
	    },
	"quick" : { <!-- another template shortcut -->

		},
	"SOME_ALIAS" :{ <!-- yet another template shortcut -->

		}
	},
}
```
  * Now there are 2 portions of `default_create` config
	*  `__always_ask` : it contains the fields which would always be prompted when you create an issue. For eg. in above given json , whenever we'll create a new issue , details and priority would always be asked along with other mandatory fields for the board.
	*  Rest of the keys in `default_create` are the shortcut keys which you will refer to while calling <kbd>jira new key</kbd>

### Edit a Jira issue:

This jira edit functionality is in beta phase and only few type of fields are allowed to be edited. **currently only items of type strings  are supported**

  * <kbd>jira edit JRA-254</kbd>
	``` json
  (0) Summary
  (1) Issue Type
  (2) Component/s
  (3) Dev Estimate
  (4) Description
  (5) Fix Version/s
  (6) Priority
  (7) Labels
  (8) Code Reviewer
  (9) Sprint
  (10) Epic Link
  (11) Attachment
  (12) Depn Team
  (13) CC
  (14) Due Date
  (15) Linked Issues
  (16) Comment
  (17) Assignee
  enter Input 7
  labels
  Enter value testlabel1,testlabel2
  Issue edited successfully!

	```

  * to edit jira in non interactive mode, giving field to be edited and its values is possible.
	* you first  need to find the actual name of the field you want to edit. For this you can use the following url <https://YOUR__JIRA__ENDPOINT/rest/api/2/issue/JRA-546/editmeta> **replace JRA-546 with the issue/type of issues you want to edit**. Its sample output is given below

	```
  fields{
	  summary	{…}
	  issuetype	{…}
	  components	{…}
	  customfield_12000	{…}
	  details	{…}
	  fixVersions	{…}
	  priority	{…}
	  labels {
		required	false
		schema	{
			type	"array"
			items	"string"
			system	"labels"
		}
		name	"Labels"
		autoCompleteUrl	"https://jira.mypaytm.com….0/labels/suggest?query="
		operations	[…]
	  }
	  customfield_11600	{…}
	  customfield_10007	{…}
	  customfield_10008	{…}
	  attachment	{…}
	  customfield_11901	{…}
	  customfield_10901	{…}
	  duedate	{…}
	  issuelinks	{…}
	  comment	{…}
	  assignee	{…}
    }
	```
  *
 <kbd>jira edit JRA-254 "FIELD_NAME::FIELDVALUES"</kbd>
	 * Fieldnames can be hard to remember when using on command line, so you can save these field names in `~/.jira/config.json` . Suppose the response of edit meta is

	``` json
	 fields	{
		summary	{…}
		issuetype	{…}
		components	{…}
		customfield_12000	{…}
		details	{…}
		fixVersions	{…}
		priority	{
			required	false
			schema	{
				type	"priority"
				system	"priority"
			}
			name	"Priority"
			operations	[…]
			allowedValues	{
			0	{
				self	"https://jira.mypaytm.com/rest/api/2/priority/1"
				iconUrl	"https://jira.mypaytm.com…/priorities/critical.svg"
				name	"Highest"
				id	"1"
				},
			1	{
				self	"https://jira.mypaytm.com/rest/api/2/priority/2"
				iconUrl	"https://jira.mypaytm.com…cons/priorities/high.svg"
				name	"High"
				id	"2"
				}
			2	{,
				self	"https://jira.mypaytm.com/rest/api/2/priority/3"
				iconUrl	"https://jira.mypaytm.com…ns/priorities/medium.svg"
				name	"Medium"
				id	"3"
				},
			3	{
				self	"https://jira.mypaytm.com/rest/api/2/priority/4"
				iconUrl	"https://jira.mypaytm.com…icons/priorities/low.svg"
				name	"Low"
				id	"4"
				},
			4	{
				self	"https://jira.mypaytm.com/rest/api/2/priority/5"
				iconUrl	"https://jira.mypaytm.com…ns/priorities/lowest.svg"
				name	"Lowest"
				id	"5"
				}
			5	{…}
			6	{…}
			7	{…}
			8	{…}
			9	{…}
		}
		labels	{…}
		customfield_11600	{…}
		customfield_10007	{…}
		customfield_10008	{…}
		attachment	{…}
		customfield_11901	{…}
		customfield_10901	{…}
		duedate	{…}
		issuelinks	{…}
		comment	{…}
		assignee	{…}
	}

	```

  * In above meta priority corresponds to CC field. So settign its default value in config.json would be

  ``` json
    "edit_meta": {
		"__default": { <!-- would work like "jira CART-2047 alias_for_high" would change the priority of task to high -->
			"alias_for_high": {
				"fields": {
					"priority": {
						"id": "2"
					}
				}
			}
		},
		"sprint": {
			"key": "customfield_10007"
		},
		"alias_for_label": { <!-- would work "jira edit CART-2047 alias_for_label::label1,label2" -->
			"key": "labels",
			"default": {
				"test1": "t1,t2"
			}
		}
	},

  ```

  * entries in edit_meta are as follows
	* <kbd>__default</kbd> : corresponds to raw put body we can put in config.json, which is passed as it is to the put call to jira edit api.
	* Other keys at the level of <kbd>__default</kbd> are alias for fields which can be used as shortform for bigger named keys. Eg. <kbd>jira edit JRA-546 "sprint::123"</kbd>  would first  check alias for key sprint in `edit_meta` , if found it picks the `key` field from the alias. and makes a put call corresponding to the actual key that has been stored.
		* <kbd>key</kbd> : actual key to which call is made to edit
		* <kbd>default</kbd> : if input value is not given corresponding to a key , for eg.  <kbd>jira edit JRA-354 `alias_for_label`</kbd> , then it picks this default key from config.json as though the input was given from commandline. It would act as if the command issued was <kbd>jira edit JRA-354 "`alias_for_label`::t1,t2"</kbd>
  * **remember that enties in <kbd>__default</kbd> should be of form <kbd>alias: {...actual json.. }</kbd>**

### Jira mark functionality to mark a jira as done,blocked, invalid etc <kbd>jira mark JRA-123</kbd>
There are multiple other jira transitions beside done,invalid,start,stop etc which are directly supported as <kbd>jira done JRA-123</kbd> or <kbd>jira invalid JRA-786</kbd> etc.
  * Sometimes some jira do not change transition into these states directly due to defined workflow. They can go into certain states only from current state. In these cases or in general you can use **jira mark** functionality. It works as follows <kbd>jira mark CART-2047</kbd>

	``` json
	$> jira mark JRA-2047
	(71) Blocked
	(91) Invalid
	(141) Done(No Prod Deply)
	(181) Wontfix
	(251) Duplicate
	(291) Partner Issue
	(301) Other tech team issue
	(241) Reopen
	Enter transition 251

	```
  * Above mentioned input would mark the task JRA-2047 as duplicate.
#### How to know the fields metadata for a project/rapidboard
  * Fill your jira link and project name in link given below
	* <https://YOUR_JIRA_LINK/rest/api/2/issue/createmeta?projectKeys=YOUR_PROJECT&expand=projects.issuetypes.fields&>
  * Now you have to find the fields for which you want to save the default values.
  * Save the `project` and `issueType` at the root level inside your KEY or alias you choose, for Eg. KEY1 in our case.
  * now create a default key with object of values corresponding values you want to set as default.
  * Now assigning values to customfields can be somewhat tricky. You'll have to check the type of customfields and their allowed values before saving them.
  * Some useful links in finding out how to use customfields would be
	* <https://docs.atlassian.com/jira/REST/server/?_ga=2.55654315.1871534859.1501779326-1034760119.1468908320#api/2/issueLink-linkIssues>
	*  <https://developer.atlassian.com/jiradev/jira-apis/about-the-jira-rest-apis/jira-rest-api-tutorials/jira-rest-api-examples#JIRARESTAPIexamples-Creatinganissueusingcustomfields>
  *  If you are not able to create a template


### Submit custom JQL to jira

  *	get issues for jql eg. <kbd>jira jql "YOUR_JQL_OR_JQL_SHORTCUT"</kbd> when using a particular jql frequently , you can save that jql in **~/.jira/config.json**,an example jql is saved there with key reported
  * eg .  jira jql reported would run the jql written against reported key [saved by default ] in ~/.jira/config.json

        Usage: jql [options] [query]
        	Options:

            -h, --help           output usage information
            -c, --custom <name>  Filter by custom jql saved in jira config


### Using jira sprint functionality, you can

  * get issues tagged in a sprint eg. <kbd>jira sprint -r YOUR_RAPIDBOARD -s STRING_TO_SEARCH_IN_SPRINT_NAME</kbd>
  * tag an issue in a sprint eg. <kbd>jira sprint -a YOUR_ISSUE_KEY -i YOUR_SPRINT_ID</kbd>
  * tag multiple issues from JQL to a sprint . Eg. <kbd>jira sprint -j YOUR_JQL_OR_JQL_SHORTCUT -i YOUR_SPRINT_ID</kbd>

Usage: sprint [options]

	Options:
    -h, --help                  output usage information
    -r, --rapidboard <name>     Rapidboard to show sprints for
    -s, --sprint <name>         Sprint to show the issues
    -a, --add <projIssue>       Add project issue to sprint
    -i, --sprintId <sprintId>   Id of the sprint
    -j, --jql <jql>             Id of the sprint
  * Suppose you want to move all of your pending issues which are present in previous sprint and not marked done . Given that `customfield_10007` corresponds to sprint. following <kbd>jira jql -c "cf[10007]=1787 and assignee=aman6.jain and status not in ('invalid','done')"</kbd> gives the issues which are not done in sprint with id 1787 . now you can use this jql to mark them moved to new sprint as <kbd>jira sprint -i 1890 -j "cf[10007]=1787 and assignee=aman6.jain and status not in ('invalid','done')"</kbd> . And all issues would move to sprint with id 1890.
### searching issues
if you want to search a text in all the issues
  * **using jira search** <kbd>jira jql search SEARCH_TERM</kbd>
  * **using jira jql [recommended]** <kbd>jira jql "summary ~ SEARCH_TERM OR details ~ SEARCH_TERM"</kbd>

--------------------------------------------------------------------------------------------------------------------------------------------------------------

### how to use username alias/nicknames with jira-cli
  * [find users username](###finding-username)
  * save the username alias/nickname in user_alias block of  .jira-cli/config.json .
	* for eg. if username  is palashkulsh@gmail.com and you choose nickname as palash then your user_alias map would look like

	``` json
		{
			"user_alias" :{
				"nickname1" : "username of user 1",
				"nickname2" : "username 2"
			}
		}
	```
	* now you can use the nickname in following commands
	  * **to add watchers** <kbd>jira watch MPP-948 nickname1</kbd>
	  * **to tag some one in comment** <kbd>jira comment MPP-948 "[~nickname2] you are tagged in this comment"</kbd>
      * **assigning an issue to someone using nickname** <kbd>jira assign MPP-948 nickname1</kbd> would assign MPP-948 to nickname1 user.


### finding username
  * to find a user's username
      * browse to their profile on jira
      * under their avatar/photo is a field called **Username**
      * this is the user's username which you should use.

### Explaining .jira-cli/config.json
  * **auth** : here the basic authentication information is stored. You would need to change it if url of your jira is changed.
	* example block

	``` json
		"auth": {
			"token": "AUTO_GENERATED_TOKEN_FROM_PASSWORD",
			"url": "YOUR_JIRA_URL",
			"user": "YOUR_JIRA_EMAIL"
		}
	```

	* mostly you wont need to touch this block, only when your username or password changes then you'll have to reconfigure it using jira config command.

  * **custom_jql**:  here you will store the jql to get the type of issues you frequently want to see and monitor in single command. eg. jira jql reported would give the issues corresponding to jql saved against reported key in custom_jql by default.
	* example block

	``` json
		"custom_jql": {
			"mpp": "project=MPP and status !=done",
			"reported": "reporter=currentUser() and status not in ('Done', 'Invalid')",
		},

	```
	* now you can use this jql in multiple commands
	  * **listing jql issues** <kbd>jira jql reported</kbd>
       * **adding all issues in jql to a sprint id** <kbd>jira sprint -j reported -i SPRINT_ID</kbd>

  * **default_create** : now this is part of the jira new functionality, in which you can configure templates in config.json, so when you create a new jira, default values are picked from templates and other required fields or fields which you have declared mandatory are prompted for your input.
  * **edit_meta**
  * **options**

Each command have individual usage help (using --help or -h)

##### Advanced options
Checkout ```.jira-cli/config.json``` for more options.

##### Use with Jira on-premise
In case of Jira installed on-premise, the SSL certificate is usually self-signed. The Superagent library used to make all the rest requests doesnt allow the use of self-signed certificates unless specifically added to the request. To allow for that a new config key is added: ```use_self_signed_certificate``` - it must be set to true and the file ```jira.crt``` containing the public certificate should be added to ```.jira-cli``` directory. An alternative is to add an environmental variable ```JIRA_CERT``` with the certificate file-path.

To get the Jira website ssl certificate follow these instructions: [export-download-ssl-certificate-from-server-site-url](https://medium.com/@menakajain/export-download-ssl-certificate-from-server-site-url-bcfc41ea46a2)

## MIT License

Copyright (c) 2019 <danpshumaker@gmail.com>
Copyright (c) 2013 <germanrcuriel@gmail.com>

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
