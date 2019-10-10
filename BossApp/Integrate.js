const jsforce = require('jsforce');
var async = require('async');
var request = require('request');
const JiraClient = require('jira-connector');
const fs = require('fs');
const prjKey = 'BM';
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
/// Set the users mapping from salesforce to Jira  map(Salesforce Name, Jira Name);
var userMap = new Map();
userMap.set('Aakanksha Sharma','aakanksha.sharma');
userMap.set('Arijit Banerjee','arijit.banerjee');
userMap.set('Apeksha Paratwar','apeksha.paratwar');
userMap.set('Barbara Kochman','Barbara.Kochman');
userMap.set('Carolyn Frances','Carolyn.Frances');
userMap.set('Dennis Bartlett-Arnot','Dennis.Bartlett-Arnot');
userMap.set('Evin Ozer','Evin.Ozer');
userMap.set('Gaetan Barbeau','Gaetan.Barbeau');
userMap.set('Gunish Chawla','gunish.chawla');
userMap.set('Hichem Sarrai','Hichem.Sarrai');
userMap.set('Jayakannan Arunachalam','Jayakannan.Arunachalam');
userMap.set('Jigyasa Palod','jigyasa.palod');
userMap.set('Justin Baidoo-Hackman','justin.baidoo-hackman');
userMap.set('Kishor Rajendra Shinde','kishor.shinde');
userMap.set('Madhura Kane','madhura.kane');
userMap.set('Majin Mathew','Majin.Mathew');
userMap.set('Michal Klucz','Michal.Klucz');
userMap.set('Nathan Ryan','nathan.ryan');
userMap.set('Peter Sabry','peter.sabry');
userMap.set('Pilar Vargas','Pilar.Vargas');
userMap.set('Rahul Pawar','rahul.pawar');
userMap.set('Ramesh Thulasi','ramesh.thulasi');
userMap.set('Renato Manzo','renato.manzo');
userMap.set('Samarjeet Kahlon','samarjeet.kahlon');
userMap.set('Samita Pradhan','samita.pradhan');
userMap.set('Sampath Medisetti','Sampath.Medisetti');
userMap.set('Samrat Chakraborty','Samrat.Chakraborty');
userMap.set('Steve Nixon','steve.nixon');
userMap.set('Sujith Maruthingal','Sujith.Maruthingal');
userMap.set('Tejesh Chotalia','tejesh.chotalia');
userMap.set('Vamisidhar saragadam','vamisidhar.saragadam');
userMap.set('Venu Navuluri','venu.navuluri');


var currentDateTime = new Date().toISOString().slice(0, -5) + "Z";

fs.readFile('LastRunDate.txt', 'utf8', function(err, lastUpdatedDate) {
    console.log(lastUpdatedDate);
});

const query = "SELECT Id,Name,Title__c, User_Story2__c,Acceptance_Criteria__c,Primary_Track__r.Name,Requirement_Status__c,Functional_Area__c, LastModifiedDate,Development_Status__c FROM Requirements__c where Primary_Track__c = 'a0r9E0000038QK3QAM' LIMIT 50"
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

async function parseSFId(response) {
    for (let rec of response.records) {
        sfIdMap.set(rec.Id, rec);
       // console.log('SFFFF ' + rec.Id);
    }
}

async function connectToJira() {
    try {
        console.log('Starting COnnection');
        searchJira();
        //checkIfExistingOrNew();
    } catch (error) {
        console.log('error');
        console.log(JSON.stringify(error));
        throw error;
    }

}

function searchJira() {
    var jiraExtID = null;

    var startAt = 0;
   var maxResults = 50;
    var queryOutputItemsCount = 0;
    var j = 1;
    var temp = 0;
    var arrayObj = [];
    var i = 0;

    var options = {
        //hostname: "finastra.atlassian.net",
        port: 443,
        //path: "/rest/api/3/search?jql=type=Story",
        method: "GET",
        headers: {
            Authorization: "Basic " + new Buffer("sujith.maruthingal@finastra.com" + ":" + "rcUDk5Dj79aHdVpRgmjaC506").toString("base64"),
            "Content-Type": "application/json"
        }
    };
    console.log('**startAt*' + startAt);

    request(`https://finastra.atlassian.net/rest/api/3/search?jql=type=Story AND project ="BossApp-Migration"`, options, function(error, response, body) {
        var temp = JSON.parse(body);
		var flag =0;
        console.log('body:', temp.issues.length); // Print the HTML for the Google homepage.
        if (temp.issues.length > 0 && temp.total>maxResults) {
            for (let singleIssue of temp.issues) {
//if(singleIssue.fields.customfield_10032!=null ){
					jiraExtIdMap.set(singleIssue.fields.customfield_10032, singleIssue.key);
				//}
				

            }
            checkIfExisting(jiraExtIdMap);
            let total = temp.total;
            let runAgain = total - maxResults;
            if (runAgain > 0) {
                startAt = maxResults;
                doLoopAgain(startAt);
            }

        } else if (temp.issues.length == 0) {
        
                                           
            createNewJiraReq();
        }
		else if(temp.issues.length != 0 && temp.total<maxResults)
		{
			NewRequirement(sfIdMap,jiraExtIdMap);
		}
    });


}

function doLoopAgain(start) {
    var startAt = start;
    var maxResults = 50;
    var queryOutputItemsCount = 0;
    var j = 1;
    var temp = 0;
    var arrayObj = [];
    var i = 0;
    //console.log('**startAt*' + startAt);

    var options = {
        //hostname: "finastra.atlassian.net",
        port: 443,
        //path: "/rest/api/3/search?jql=type=Story",
        method: "GET",
        headers: {
            Authorization: "Basic " + new Buffer("sujith.maruthingal@finastra.com" + ":" + "rcUDk5Dj79aHdVpRgmjaC506").toString("base64"),
            "Content-Type": "application/json"
        }
    };

    request(`https://finastra.atlassian.net/rest/api/3/search?jql=type=Story AND project ="BossApp-Migration"&startAt=${startAt}`, options, function(error, response, body) {
        var temp = JSON.parse(body);
        if (temp.issues.length > 0) {
            for (let singleIssue of temp.issues) {
					//if(singleIssue.fields.customfield_10032!=null){
					jiraExtIdMap.set(singleIssue.fields.customfield_10032, singleIssue.key);
				//}   
			}
            checkIfExisting(jiraExtIdMap);
            let total = temp.total;
            if (start + maxResults < total) {
                doLoopAgain(start + maxResults);
            }
		   if(jiraExtIdMap.size==total)
		   {
				NewRequirement(sfIdMap,jiraExtIdMap);
		   }
        }
    });

}

function createNewJiraReq() {
  //console.log('>>>Inside createNewJiraReq ');
    for (let sfKey of sfIdMap.keys()) {
        let sfData = sfIdMap.get(sfKey);
      //  console.log('sfKey--' + sfKey);
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
    }
    if (createArr) createIssue(createArr);
}


function NewRequirement(sfIdMap, jiraExtIdMap) {
    console.log('inside jiraExtIdMap'+jiraExtIdMap.size);
    console.log('inside sfIdMap'+sfIdMap.size);
    var testVal;
   // for (var [key, val] of sfIdMap) {
                 var i=1;
    for (let sfrecID of sfIdMap.keys()) {
           //testVal = jiraExtIdMap.get(key);
                                //console.log('enter 3 times'+sfrecID);
			
			   if(jiraExtIdMap.get(sfrecID) == undefined){
	                 let sfData = sfIdMap.get(sfrecID);
					  console.log('sfKey--' + sfrecID);
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
					  createArrNew.push(tempCreate);
			   }
          
        }
        // console.log('inside createArrNew'+ JSON.stringify(createArrNew));
        if (createArrNew) createIssue(createArrNew);
    }

function checkIfExisting(jiraExtIdMap) {
    for (let sfKey of jiraExtIdMap.keys()) {
       //console.log('inside else' + sfKey);
        let sfData1 = sfIdMap.get(sfKey);
        //console.log('inside else' + sfData1);
        if (sfData1 !== undefined) {
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
				console.log('inside else');
                devStatus = '11';
            }
            console.log('*devStatus >>>>>* **' + devStatus);
            tempUpdate.issueId = updateTrans.issueId = sfIdMap.get(sfKey);
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
        
    }
	
if (updateArr) updateIssue(updateArr);
if (updateTrans) updateTranscation(updateStatus);
//NewRequirement(sfIdMap, jiraExtIdMap);
}



function createIssue(createNewArr) {
    var issueUpdateObj = {};
    issueUpdateObj.issueUpdates = [];
   for (let cObj of createNewArr) {
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
        res.on("data", function(body) {
			console.log(body);
		});
       


    });
    req.on("error", function(e) {
       // console.log("problem with request: " + e.message);
    });


    
    var jirapostString = JSON.stringify(issueUpdateObj);
    req.write(jirapostString);
    req.end();
   
}



async function updateTranscation(updateStatus) {
	console.log('transition',JSON.stringify(updateStatus));
    async.eachSeries(updateStatus, function(updTran, callback) {
        jira.issue.transitionIssue(updTran, function(error, success) {
            //console.log(' Success - ' + JSON.stringify(success));
            console.log(' Error - ' + JSON.stringify(error));
            callback(null, !error);
        });

    }, function(err, result) {
        // if result is true then every file exists
    });

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

    
}
connectSalesforce().then(result => {});
//searchJira();
