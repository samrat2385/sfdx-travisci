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
var jiraExtID = null;

var currentDateTime = new Date().toISOString().slice(0, -5) + "Z";

fs.readFile('LastRunDate.txt', 'utf8', function(err, lastUpdatedDate) {
    console.log(lastUpdatedDate);
});

//const query = "SELECT Id,Name,Title__c, User_Story2__c,Acceptance_Criteria__c,Primary_Track__r.Name,Requirement_Status__c,Functional_Area__c, LastModifiedDate,Development_Status__c FROM Requirements__c where Name In ('REQ-3105','REQ-3106','REQ-3110','REQ-3114','REQ-3115','REQ-3116','REQ-3117','REQ-3118','REQ-3119','REQ-3121','REQ-3511')";
const query = "SELECT Id,Name,Title__c, User_Story2__c,Acceptance_Criteria__c,Primary_Track__r.Name,Requirement_Status__c,Functional_Area__c, LastModifiedDate,Development_Status__c FROM Requirements__c where Primary_Track__c = 'a0r9E0000038QK3QAM' LIMIT 10"
    //const query = "SELECT Id,Name,Title__c, User_Story2__c,Acceptance_Criteria__c,Primary_Track__r.Name,Requirement_Status__c,Functional_Area__c, LastModifiedDate,Development_Status__c FROM Requirements__c where Name In ('REQ-3105')";
    //const query = "SELECT Id,Name,Title__c, User_Story2__c,Acceptance_Criteria__c,Primary_Track__r.Name,Development_Owner__r.Name,Requirement_Status__c,Functional_Area__c, LastModifiedDate FROM Requirements__c where Requirement_Status__c = 'Withdrawn' and  LastModifiedDate := lastUpdatedDate";
const jira = new JiraClient({ host: 'finastra.atlassian.net', basic_auth: { username: 'sujith.maruthingal@finastra.com', password: 'rcUDk5Dj79aHdVpRgmjaC506' } });


fs.writeFile('LastRunDate.txt', currentDateTime, (err) => {
    if (err) throw err;
    console.log('Last run date saved to file.');
});

async function connectSalesforce() {
    try {
        var conn = new jsforce.Connection({ loginUrl: sfurl });
        conn.login('sujith.maruthingal@finastra.com.findev', 'Phoenix_77GkGu5Fc6nw6JahSGoLDc38hI2', function(err, result) {
            conn.query(query, function(err, response) {

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

function parseSFId(response) {
    for (let rec of response.records) {
        sfIdMap.set(rec.Id, rec);
    }
}

// function connectToJira() {
//     try {
//         console.log('Starting COnnection');
//         checkIfExistingOrNew();
//     } catch (error) {
//         console.log('error');
//         console.log(JSON.stringify(error));
//         throw error;
//     }

// }

// function checkIfExistingOrNew() {

//     for (let sfKey of sfIdMap.keys()) {
//         //console.log('sfKey ' + sfKey)
//         jira.search.search({ jql: 'externalID ~ \'' + sfKey + '\'' }, (error, response) => {
//             if (response) {
//                 if (response.issues.length > 0) {
//                     try {
//                         jiraExtID = response.issues[0].fields.customfield_10032;
//                     } catch (err) {
//                         //jiraExtID = response.issues.fields.customfield_10032;
//                     }
//                      console.log('jiraExtID--' + jiraExtID);
//                 }
//             }
//         });

//     }
// }

async function connectToJira() {
    var startAt = 0;
    var maxResults = 50;
    var queryOutputItemsCount = 0;
    var j = 1;
    for (let i = 0; i < j; i++) {
        jira.search.search({ jql: 'type = Story', 'startAt': startAt }, (error, response) => {
            if (response) {
                for (let res of response.issues) {
                    if (res.fields.customfield_10032 !== null) {
                        jiraMap.set(res.fields.customfield_10032, res);
                    }
                }
                let total = response.total;
                let runAgain = total - maxResults;
                if (runAgain > 0) {
                    j++;
                    startAt += maxResults;
                } else {

                }
            }
        });
    }
    return jiraMap;
    console.log('***jiraMap**' + JSON.stringify(jiraMap));
}

function testMyCall() {
    var options = {
        hostname: "finastra.atlassian.net",
        port: 443,
        path: "/rest/api/3/search?jql=type=story",
        method: "GET",
        headers: {
            Authorization: "Basic " + new Buffer("sujith.maruthingal@finastra.com" + ":" + "rcUDk5Dj79aHdVpRgmjaC506").toString("base64"),
            "Content-Type": "application/json"
        }
    };
	var mapArray=[];
    var req = https.request(options, function(res) {
       // console.log('******' + res.body);
        res.setEncoding("utf8");
        res.on("data", function(body) {
           //console.log(body);
		   mapArray.push(body);
        });
    });
	console.log(mapArray);


    req.on("error", function(e) {
        console.log("problem with request: " + e.message);
    });

    req.end();

}



function callArray() {
    if (jiraExtID !== sfKey) {
        let sfData = sfIdMap.get(sfKey);
        console.log('sfKey--' + sfKey);
        console.log('jiraExtID--' + jiraExtID);

        var tempCreate = {};
        tempCreate.fields = {};
        tempCreate.fields.project = {};
        tempCreate.fields.issuetype = {};
        tempCreate.fields.project.key = {};
        tempCreate.fields.issuetype.name = {};
        tempCreate.fields.issuetype.name = issueKey;
        tempCreate.fields.project.key = prjKey;
        tempCreate.fields.summary = sfData.Name;
        tempCreate.fields.description = {};
        tempCreate.fields.description.type = 'doc';
        tempCreate.fields.description.version = 1;
        tempCreate.fields.description.content = [];
        var docObj = {};
        docObj.type = 'paragraph';
        docObj.content = [];
        var docType = {};
        docType.text = 'URL : ' + requrl + sfData.Id + ' ' + sfData.User_Story2__c;
        docType.type = 'text';
        docObj.content.push(docType);
        tempCreate.fields.description.content.push(docObj);
        tempCreate.fields.customfield_10030 = sfData.Requirement_Status__c;
        tempCreate.fields.customfield_10031 = {}; //=  sfData.Acceptance_Criteria__c;
        tempCreate.fields.customfield_10031.type = 'doc';
        tempCreate.fields.customfield_10031.version = 1;
        tempCreate.fields.customfield_10031.content = [];
        var custObj = {};
        custObj.type = 'paragraph';
        custObj.content = [];
        var custType = {};
        if (sfData.Acceptance_Criteria__c == null) {
            custType.text = 'NA';
        } else {
            custType.text = sfData.Acceptance_Criteria__c;
        }
        custType.type = 'text';
        custObj.content.push(custType);
        tempCreate.fields.customfield_10031.content.push(custObj);
        tempCreate.fields.customfield_10032 = sfData.Id;
        tempCreate.fields.customfield_10044 = sfData.Functional_Area__c;
        tempCreate.fields.customfield_10045 = sfData.Primary_Track__r.Name;
        createArr.push(tempCreate);
    } else {
        console.log('else sfKey--' + sfKey);
        console.log('else jiraExtID--' + jiraExtID);
        let sfData1 = sfIdMap.get(sfKey);
        var tempUpdate = {};
        var updateTrans = {};
        var devStatus = "";
        if (sfData1.Development_Status__c == "Not Started") {
            devStatus = '11';
        } else if (sfData1.Development_Status__c == "In Progress") {
            devStatus = '81';
        } else if (sfData1.Development_Status__c == "On Hold") {
            devStatus = '71';
        } else if (sfData1.Development_Status__c == "Ready for Internal QA") {
            devStatus = '91';
        } else if (sfData1.Development_Status__c == "In Testing") {
            devStatus = '101';
        } else if (sfData1.Development_Status__c == "Bug/Defect") {
            devStatus = '171';
        } else if (sfData1.Development_Status__c == "Closed/Implemented") {
            devStatus = '161';
        } else if (sfData1.Development_Status__c == "Development Under Review") {
            devStatus = '8';
        } else {
            devStatus = '11';
        }
        tempUpdate.issueId = updateTrans.issueId = jiraExtID;
        updateTrans.transition = {};
        updateTrans.transition.id = devStatus;
        tempUpdate.issue = {};
        tempUpdate.issue.fields = {};
        tempUpdate.issue.fields.description = "URL : " + requrl + sfData1.Id + " " + sfData1.User_Story2__c;
        tempUpdate.issue.fields.summary = sfData1.Name;
        tempUpdate.issue.fields.customfield_10031 = sfData1.Acceptance_Criteria__c;
        tempUpdate.issue.fields.customfield_10044 = sfData1.Primary_Track__r.Name;
        tempUpdate.issue.fields.customfield_10045 = sfData1.Functional_Area__c;
        updateStatus.push(updateTrans)
        updateArr.push(tempUpdate);
    }

    if (createArr) createIssue(createArr);
    //if (updateArr) updateIssue(updateArr);
    //if (updateTrans) updateTranscation(updateStatus);


}





function createIssue(createArr) {
    console.log('*createIssue***' + createArr.size);
    var issueUpdateObj = {};
    issueUpdateObj.issueUpdates = [];
    for (let cObj of createArr) {
        issueUpdateObj.issueUpdates.push(cObj);
    }

    var options = {
        hostname: "finastra.atlassian.net",
        port: 443,
        path: "/rest/api/3/issue/bulk",
        method: "POST",
        headers: {
            Authorization: "Basic " + new Buffer("sujith.maruthingal@finastra.com" + ":" + "rcUDk5Dj79aHdVpRgmjaC506").toString("base64"),
            "Content-Type": "application/json"
        }
    };


    var req = https.request(options, function(res) {
        res.setEncoding("utf8");
        res.on("data", function(body) {});

    });
    req.on("error", function(e) {
        console.log("problem with request: " + e.message);
    });



    var jirapostString = JSON.stringify(issueUpdateObj);
    //'{ "issueUpdates": [{ "fields": { "project": { "key": "TBA" }, "issuetype": { "name": "Story" }, "summary": "REQ-3507", "description": { "type": "doc", "version": 1, "content": [{ "type": "paragraph", "content": [{ "text": "description", "type": "text" }] }] }, "customfield_10030": "In Discussion", "customfield_10032": "a0n9E000002zmXAQAY", "customfield_10044": "Sales Order Generation", "customfield_10045": "LnE Billing" } }, {"fields": { "project": { "key": "TBA" }, "issuetype": { "name": "Story" }, "summary": "REQ-3507", "description": { "type": "doc", "version": 1, "content": [{ "type": "paragraph", "content": [{ "text": "description", "type": "text" }] }] }, "customfield_10030": "In Discussion", "customfield_10032": "a0n9E000002zmXAQAY", "customfield_10044": "Sales Order Generation", "customfield_10045": "LnE Billing" } }] }';
    req.write(jirapostString);
    req.end();
    //req.close();



    /* async.eachSeries(createArr, function(reqCreate, callback) {
         jira.issue.createIssue(reqCreate, function(error, success) {
             console.log(' Success - ' + JSON.stringify(success));
             console.log(' Error - ' + JSON.stringify(error));
             callback(null, !error);
         });

     }, function(err, result) {
         // if result is true then every file exists
     });*/

    /* jira.issue.bulkCreate(JSON.stringify(createArr), function (error, success) {
        console.log(' Success - ' + JSON.stringify(success));
        console.log(' Error - ' + JSON.stringify(error));
        //callback(null, !error);
    });
*/
    // fs.access(filePath, function(err) {
    //     callback(null, !err)
    // });



    // for (let reqCreate of createArr) {

    //     jira.issue.createIssue(reqCreate, function (error, success) {

    //         console.log(' Success - ' + JSON.stringify(success));
    //         console.log(' Error - ' + JSON.stringify(error));
    //     });
    // }
}

async function updateTranscation(updateStatus) {
    console.log('***updateStatus**' + updateStatus);
    async.eachSeries(updateStatus, function(updTran, callback) {
        jira.issue.transitionIssue(updTran, function(error, success) {
            console.log(' Success - ' + JSON.stringify(success));
            console.log(' Error - ' + JSON.stringify(error));
            callback(null, !error);
        });

    }, function(err, result) {
        // if result is true then every file exists
    });


    // for (let updTran of updateStatus) {
    //     //console.log('****reqUpdate****'+JSON.stringify(updTran));

    //     jira.issue.transitionIssue(updTran, function (error, success) {
    //         //console.log(JSON.stringify(updTran));
    //         console.log(updTran.issueId + ' - ' + JSON.stringify(success));
    //         console.log(updTran.issueId + ' - ' + JSON.stringify(error));
    //     });
    // }
}

async function updateIssue(updateArr) {
    async.eachSeries(updateArr, function(reqUpdate, callback) {
        jira.issue.editIssue(reqUpdate, function(error, success) {
            // console.log(' Success - ' + JSON.stringify(success));
            // console.log(' Error - ' + JSON.stringify(error));
            // callback(null, !error);
        });

    }, function(err, result) {
        // if result is true then every file exists
    });

    // for (let reqUpdate of updateArr) {
    //     console.log('****reqUpdate****' + JSON.stringify(reqUpdate));
    //     jira.issue.editIssue(reqUpdate, function (error, success) {
    //         console.log('*Sucess**' + JSON.stringify(success));
    //         console.log('*fail**' + JSON.stringify(error));
    //     });
    // }
}
testMyCall(); //.then(result => {});