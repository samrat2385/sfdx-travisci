const jsforce = require('jsforce');
var async = require('async');
var request = require('request');
const JiraClient = require('jira-connector');
const fs = require('fs');
const prjKey = 'TBAP';
const prjName = 'TBAProject'
const issueKey = 'Story';
const sfurl = 'https://test.salesforce.com';
const requrl = 'https://misys--findev.cs88.my.salesforce.com/';
var jiraMap = new Map();
var sfIdMap = new Map();
var createArr = [];
var createArrNew = [];
var updateArr = [];
var updateStatus = [];
var https = require("https");
var jiraExtIdMap = new Map();
var jiraExtID=null;

const jira = new JiraClient({ host: 'finastra.atlassian.net', basic_auth: { username: 'sujith.maruthingal@finastra.com', password: 'rcUDk5Dj79aHdVpRgmjaC506' } });


/*

Step 1 - Get all the issues from Salesforce.

Async.series and then async.waterfall
Async.waterfall

A. Search for an existing JIRA issue
B. If not found, then create
C. If found then update. 

*/
const query = "SELECT Id,Name,Title__c, User_Story2__c,Acceptance_Criteria__c,Primary_Track__r.Name,Requirement_Status__c,Functional_Area__c, LastModifiedDate,Development_Status__c FROM Requirements__c where Primary_Track__c = 'a0r9E0000038QK3QAM'"



async function getSalesforceRecord(callback) {
    try {
        var conn = new jsforce.Connection({ loginUrl: sfurl });
        conn.login('sujith.maruthingal@finastra.com.findev', 'Phoenix_77GkGu5Fc6nw6JahSGoLDc38hI2', function(err, result) {
            conn.query(query, function(err, response) {

                if (response) {
                    parseSFId(callback, response);
                    //connectToJira();
                }
            });
        });

    } catch (error) {
        throw error;
    }
}


async function parseSFId(callback, response) {
    
    
    async.every(['file1','file2','file3'], function(filePath, callback) {
        fs.access(filePath, function(err) {
            callback(null, !err)
        });
    }, function(err, result) {
        // if result is true then every file exists
    });


    for (let rec of response.records) {
        sfIdMap.set(rec.Id, rec);
       console.log('SFFFF ' + rec.Id);
    
    }
}


// Start execution
//getSalesforceRecord(callback);
// Or, with named functions:

var arrayOfSalesforceRecords = [];
var mapOfSFRecords = new Map();
var arrayOfJIRARecordsToUpdate = [];
var arrayOfSalesforceRecordsToCreate = [];

async.waterfall([
    getSalesforceRecords,
    checkIfRecordsExistInJIRA,
    updateExistingRecords,
    createNewRecords,
], function (err, result) {
    // result now equals 'done'
    if(!err) {
        console.log(result);
    } else  {
        console.log(err);
    }
});

function getSalesforceRecords(callback) {
    try {
        var conn = new jsforce.Connection({ loginUrl: sfurl });
        conn.login('sujith.maruthingal@finastra.com.findev', 'Phoenix_77GkGu5Fc6nw6JahSGoLDc38hI2', function(err, result) {
            conn.query(query, function(err, response) {
                if (response) {
                    async.eachSeries(response.records, function(rec, eachseries_callback) {
                        mapOfSFRecords.set(rec.Id, rec);
                        eachseries_callback(null)                       
                    }, function(err, result) {
                        // All Okay.
                        callback(null, mapOfSFRecords);
                    });
                } else {
                    // Error from Salesforce. 
                    callback('no response from salesforce', null);
                }
            });
        });
    } catch (error) {
        // Something else went wrong. 
        callback(error, null);
    }
}

function checkIfRecordsExistInJIRA(mapOfSFRecords, callback) {
    console.log('Step 2');
    var counter = 0;
    var not_found_counter = 0;
    // Loop through the salesforce records and check if there a record in JIRA with this external ID
    async.eachSeries(mapOfSFRecords.keys(), function(sfRecordId, eachseries_callback) {
        // var jqlSearchString = '{ jql: externalID ~ \'' + sfRecordId + '\' }';
        // console.log(jqlSearchString);
        
        jira.search.search({ jql: 'project= TBAProject AND externalID ~ \'' + sfRecordId + '\'' }, (error, response) => {
            if (response) {
                if (response.issues.length > 0) {
                    
                    // if we found an issue. 
                    // TO DO - optize this code to check for array instead of a try catch. 
                    try {
                        jiraExtID = response.issues[0].fields.customfield_10032;
                    } catch (err) {
                        jiraExtID = response.issues.fields.customfield_10032;
                    }
                    arrayOfJIRARecordsToUpdate.push(jiraExtID);
                } else  {
                    // if the search results were zero. 
					
                    arrayOfSalesforceRecordsToCreate.push(sfRecordId);
					
                }

                counter = counter + 1;
               // console.log('jiraExtID ' + jiraExtID);
                eachseries_callback(null) ;
            } else {
                not_found_counter = not_found_counter + 1;
                eachseries_callback('no response from jira' + error);      
            }

        });

        //TODO - if result is found add it to the update array, if not found - add the issue to the create array. 

    }, function(err, result) {
        console.log('Total Records found in JIRA ' + counter);
        console.log('Total Records NOT found in JIRA ' + not_found_counter);

        // All Okay.
        if(!err) {
            // TODO  = Pass the correct map forward.
            callback(null, arrayOfJIRARecordsToUpdate, arrayOfSalesforceRecordsToCreate);
        }
        else   
            callback(err);        
    });
}

function updateExistingRecords(arrayOfJIRARecordsToUpdate, arrayOfSalesforceRecordsToCreate, callback) {
   
    console.log('Step 3');
    console.log('Records to update ' + arrayOfJIRARecordsToUpdate.size);
    console.log('Records to create ' + arrayOfSalesforceRecordsToCreate.size);
    // We are not looping over the records to update and invoking jira one record at a time.

    async.eachSeries(arrayOfJIRARecordsToUpdate, function(rec, eachseries_callback) {
        //mapOfSFRecords.set(rec.Id, rec);
        // JIRA SET TRANSITION. 

        // Construct the jira issue 
        var salesforceRecord = mapOfSFRecords.get(rec);

        var jiraIsseToUpdate = {};
        var updateTrans = {};
        var devStatus = "";
        if (salesforceRecord.Development_Status__c == "Not Started") {
            devStatus = '11';
        } else if (salesforceRecord.Development_Status__c == "In Progress") {
            devStatus = '81';
        } else if (salesforceRecord.Development_Status__c == "On Hold") {
            devStatus = '71';
        } else if (salesforceRecord.Development_Status__c == "Ready for Internal QA") {
            devStatus = '91';
        } else if (salesforceRecord.Development_Status__c == "In Testing") {
            devStatus = '101';
        } else if (salesforceRecord.Development_Status__c == "Bug/Defect") {
            devStatus = '171';
        } else if (salesforceRecord.Development_Status__c == "Closed/Implemented") {
            devStatus = '161';
        } else if (salesforceRecord.Development_Status__c == "Development Under Review") {
            devStatus = '8';
        } else {
            devStatus = '11';
        }

        jiraIsseToUpdate.issueId = updateTrans.issueId = rec;

        updateTrans.transition = {};
        updateTrans.transition.id = devStatus;
        
        jiraIsseToUpdate.issue = {};
        jiraIsseToUpdate.issue.fields = {};
        jiraIsseToUpdate.issue.fields.description = "URL : " + requrl + salesforceRecord.Id + " " + salesforceRecord.User_Story2__c;
        jiraIsseToUpdate.issue.fields.summary = salesforceRecord.Name;
        jiraIsseToUpdate.issue.fields.customfield_10031 = salesforceRecord.Acceptance_Criteria__c;
        jiraIsseToUpdate.issue.fields.customfield_10044 = salesforceRecord.Primary_Track__r.Name;
        jiraIsseToUpdate.issue.fields.customfield_10045 = salesforceRecord.Functional_Area__c;
        
        //updateStatus.push(updateTrans)
        //updateArr.push(tempUpdate);

        /*jira.issue.transitionIssue(updateTrans, function(error, success) {
            //console.log(' Success - ' + JSON.stringify(success));
            //console.log(' Error - ' + JSON.stringify(error));
            if(!error) {
                eachseries_callback(null);
            } else  {
                eachseries_callback(error);
            }
        });*/

        // TODO - Add a searial update for edits.

        //eachseries_callback(null);                       

    }, function(err, result) {
        // All Okay.
        if(!err) {
            console.log('All issues updated successfully');
            callback(null, mapOfSFRecords);
        } else {
            console.log(err);
            callback(err, mapOfSFRecords);
        }
    });
    callback(null, arrayOfSalesforceRecordsToCreate);
}

function createNewRecords(arrayOfSalesforceRecordsToCreate, callback) {

    callback(null, 'done');
}
