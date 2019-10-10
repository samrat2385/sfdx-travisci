const jsforce = require('jsforce');
var async = require('async');
var request = require('request');
const JiraClient = require('jira-connector');
const fs = require('fs');
const prjKey = 'TBANEW';
const issueKey = 'Story';
const sfurl = 'https://test.salesforce.com';
const requrl = 'https://misys--findev.cs88.my.salesforce.com/';
var jiraMap = new Map();
var sfIdMap = new Map();
var createArr = [];
var updateArr = [];
var updateStatus = [];
var https = require("https");

//const query = "SELECT Id,Name,Title__c, User_Story2__c,Acceptance_Criteria__c,Primary_Track__r.Name,Requirement_Status__c,Functional_Area__c, LastModifiedDate,Development_Status__c FROM Requirements__c where Name In ('REQ-3105','REQ-3106','REQ-3110','REQ-3114','REQ-3115','REQ-3116','REQ-3117','REQ-3118','REQ-3119','REQ-3121','REQ-3511')";
const query = "SELECT Id,Name,Title__c, User_Story2__c,Acceptance_Criteria__c,Primary_Track__r.Name,Requirement_Status__c,Functional_Area__c, LastModifiedDate,Development_Status__c FROM Requirements__c where Primary_Track__c = 'a0r9E0000038QK3QAM' LIMIT 120"
//const query = "SELECT Id,Name,Title__c, User_Story2__c,Acceptance_Criteria__c,Primary_Track__r.Name,Requirement_Status__c,Functional_Area__c, LastModifiedDate,Development_Status__c FROM Requirements__c where Name In ('REQ-3105')";
//const query = "SELECT Id,Name,Title__c, User_Story2__c,Acceptance_Criteria__c,Primary_Track__r.Name,Development_Owner__r.Name,Requirement_Status__c,Functional_Area__c, LastModifiedDate FROM Requirements__c where Requirement_Status__c = 'Withdrawn' and  LastModifiedDate := lastUpdatedDate";
const jira = new JiraClient({ host: 'finastra.atlassian.net', basic_auth: { username: 'sujith.maruthingal@finastra.com', password: 'rcUDk5Dj79aHdVpRgmjaC506' } });

async function connectSalesforce() {
    console.log('Trying connectSalesforce');

    try {
        var conn = new jsforce.Connection({ loginUrl: sfurl });
        conn.login('sujith.maruthingal@finastra.com.findev', 'Phoenix_77GkGu5Fc6nw6JahSGoLDc38hI2', function (err, result) {
            conn.query(query, function (err, response) {

                if (response) {
                    parseSFId(response);
                    console.log('Trying connection');
                    connectToJira();
                }
            });
        });

    } catch (error) {
        throw error;
    } 

}

async function parseSFId(response) {
    for (let rec of response.records) {
        sfIdMap.set(rec.Id, rec);
    }
}

 function connectToJira() {
    try {
        console.log('Starting Connection'); 
        checkIfExistingOrNew();
    } catch (error) {
        console.log('error');
        console.log(JSON.stringify(error));
        throw error;
    }   

}

function checkIfExistingOrNew() {
    console.log('checkIfExistingOrNew');
    var jiraExtID =null;
  
		 
			for (let sfKey of sfIdMap.keys()) {
				
				
				//var temp = '{jql:\'externalID ~'+sfKey+'\'}';
				
				//console.log('sfkey-----'+sfkey);
				//jira.search.search({ jql: 'type=Story'}, (error, response) => {
				jira.search.search({ jql: 'externalID ~ \''+sfKey+'\''}, (error, response) => {
				//jira.search.search(temp, (error, response) => {
					//console.log('response--++'+JSON.stringify(response));
										console.log('error--++'+JSON.stringify(error));

				if (response) {
				// if (inCache(response)) {
				//callback(null, cache[response]); 
				//} else {
					//jiraExtID= response.issues.fields.customfield_10032;
				//}
					console.log('response--'+JSON.stringify(response));
				}
				});
			} 
		
 

        
   // if (createArr) createIssue(createArr);
    //if (updateArr) updateIssue(updateArr);
    //if (updateTrans) updateTranscation(updateStatus);
}

connectSalesforce().then(result => { });
