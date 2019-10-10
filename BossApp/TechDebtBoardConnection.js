/********************* LNE Billing Track from BOSS APP**********************/
/** Before running please update
1. prjKey
2. prjName.
3. jql query inside checkIfRecordIsInJIRA method
4. fetch the sprint id'salesforce
5. Update the BOSS spritn and Jira sprint mapping in create and update loops
****************************************************************************/


var async = require('async');
const jsforce = require('jsforce');
var request = require('request');
const JiraClient = require('jira-connector');
const jira = new JiraClient({
    host: 'finastra.atlassian.net',
    basic_auth: {
        username: 'gunish@cloudsandbox.com',
        password: 'qqc0z2djEU9VHdm2blM649FB'
    }
});
// global constants
const prjKey = 'RBXBS';
const prjName = 'RUBIXBOSS';
const issueKey = 'Story';
const sfurl = 'https://test.salesforce.com';
const requrl = 'https://misys--rubixboss.cs88.my.salesforce.com';
const query = "SELECT Id, Name, Title__c, User_Story2__c, Acceptance_Criteria__c, Primary_Track__r.Name, Requirement_Status__c, Functional_Area__c, LastModifiedDate, Development_Status__c, Development_Sprint__c, Development_Owner__c, Development_Owner__r.Name FROM Requirements__c where Primary_Track__c != 'a0r9E0000054HMPQA2' ORDER BY Name";


// global variables
var mapOfSFRecords = new Map();
var externalIDForSearch = null;
var sfRecordId = null;
//var recordExists = false;

var jiraIssueKey = null;

var editRequired = false;
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
// Kick Off
function startProcess() {
    try {
        var conn = new jsforce.Connection({
            loginUrl: sfurl
        });
        conn.login('samrat.chakraborty@finastra.com.rubixboss', 'Newuser!230aIEgalnTWWhXTihcF33S8qVf', function(err, result) {
            conn.query(query, function(err, response) {
                if (response) {
                    console.log('Got a response from salesforce, Number of records found - ' + response.records.length );         
                   // startJiraSync(response.records);
                } else {
                    // Error from Salesforce. 
					console.log('no response from salesforce');
                    callback('no response from salesforce', null);
                }
            });
        });
    } catch (error) {
        // Something else went wrong. 
        console.log('Unexpected error :' + error);
        callback(error);
    }
}



function startJiraSync(salesforceRecords) {
    async.eachSeries(salesforceRecords, function(rec, eachseries_callback) {
        // Add the record to the global map.
        mapOfSFRecords.set(rec.Id, rec);
        externalIDForSearch = rec.Id;
        // go over the process
        // 1. check if this is in JIRA
        // 2. If it is in JIRA - call edit issue and call update transition. 
        // 3. If it is not in JIRA - create a new issue.

        async.waterfall([
            checkIfRecordIsInJIRA,
            createRecordInJira,
            editRecordInJira,
            updateTransitionInJira,

        ], function(err, result) {
            //console.log(result);
            eachseries_callback(null);
        });


    }, function(err, result) {
        // All Okay.
        console.log('Number of Records Processes ' + mapOfSFRecords.size);
    });
}

function checkIfRecordIsInJIRA(callback) {
    try {
        sfRecordId = externalIDForSearch;
        console.log('*** Starting a new loop - Salesforce ID - ' + externalIDForSearch + ' ***');
        
        var recordExists = false;
        
        console.log('Step 1');
        jira.search.search({
            jql: 'project= "Rubix" AND externalID ~ \'' + sfRecordId + '\''
        }, (error, response) => {
            if (response) {
                if (response.issues.length == 1) {
                    recordExists = true;
                    jiraIssueKey = response.issues[0].key;
                    // console.log("jira issue key" + jiraIssueKey);
                    callback(null, sfRecordId, recordExists, jiraIssueKey);
                } else if (response.issues.length == 0) {
                    // if the search results were zero. 
                    recordExists = false;
                    callback(null, sfRecordId, recordExists, jiraIssueKey);
                } else {
                    
                    console.log('There are duplicate issues in Jira');
                    callback('Error - There are duplicate issues in Jira');
                }

            } else {
                callback('no response from jira ' + error);
            }
        });
    } catch (error) {
        // Something else went wrong. 
        callback(error, null);
    }
}

function createRecordInJira(sfRecordId, recordExists, jiraIssueKey, callback) {
    console.log('Step 2');
    //console.log('createRecordInJira recordExists ' + recordExists);
    //console.log('createRecordInJira sfrecordid ' + sfRecordId);
    //editRequired = false;
    var jiraIssue = {};
	var reporter={};
    var sfData = mapOfSFRecords.get(sfRecordId);
	var setSprintID=null;
    if (!recordExists) {
        console.log('Creating a new issue in JIRA');
        // create the record in JIRA.
        // if record does not exist - we have just created it and no edit required.
        editRequired = false;

        // mapping the SF Data to JIra columns for Edit

        jiraIssue.fields = {};
        jiraIssue.fields.project = {};
        jiraIssue.fields.issuetype = {};
        jiraIssue.fields.project.key = {};
        jiraIssue.fields.issuetype.name = {};
        jiraIssue.fields.issuetype.name = issueKey;
        jiraIssue.fields.project.key = prjKey;
        jiraIssue.fields.summary = sfData.Name;
        jiraIssue.fields.description = "URL : " + requrl + sfData.Id + " " + sfData.User_Story2__c;
        jiraIssue.fields.customfield_10030 = sfData.Requirement_Status__c;
        jiraIssue.fields.customfield_10031 = sfData.Acceptance_Criteria__c;
        jiraIssue.fields.customfield_10032 = sfData.Id;
        jiraIssue.fields.customfield_10044 = sfData.Functional_Area__c;
        jiraIssue.fields.customfield_10045 = sfData.Primary_Track__r.Name;
		
		if(sfData.Business_Owner__c !=null)
			jiraIssue.fields.customfield_10057 = sfData.Business_Owner__r.Name;
		//********IMPORTANT STEPS TO FIND SPRINT IDS**************
		// the Sprints should be created in the resprctive project boards
		// use the following URL to fetch the board ids https://finastra.atlassian.net/rest/agile/1.0/board
		// then for the board id fetch all the sprints using https://finastra.atlassian.net/rest/agile/1.0/board/{RELACE WITH BOARD ID eg 15}/sprint
		
		// then update the below code for the sprint ID mappings
		/////////////////**********************//////
		
		if (sfData.Development_Sprint__c == "Sprint 1")
			setSprintID=19;
		else if (sfData.Development_Sprint__c == "Sprint 2")
			setSprintID=20;
		else if (sfData.Development_Sprint__c == "Sprint 3")
			setSprintID=21;
		else if (sfData.Development_Sprint__c == "Sprint 4")
			setSprintID=22;
		else if (sfData.Development_Sprint__c == "Sprint 5")
			setSprintID=23;
		else if (sfData.Development_Sprint__c == "Sprint 6")
			setSprintID=24;
		else
			setSprintID=null;
		jiraIssue.fields.customfield_10021=setSprintID;
		
		
		//User Mapping for Assignee fields
		var assignIssue = {};
		var assigneeName=null;		
		if(sfData.Development_Owner__c != null){
			
			assigneeName=userMap.get(sfData.Development_Owner__r.Name);
			if(assigneeName == null)
			{
				jiraIssue.fields.assignee=null;
			}
			else{
				assignIssue.name=assigneeName;
				jiraIssue.fields.assignee=assignIssue;
			}
			
		}
		else 
			jiraIssue.fields.assignee=null;
		///User mapping ends
		
		reporter.name='Gunish1';
		jiraIssue.fields.reporter=reporter;

        try {
            jira.issue.createIssue(jiraIssue, function(error, success) {
                if (!error) {
                    jiraIssueKey = success.key;
                    callback(null, sfRecordId, editRequired, jiraIssue, jiraIssueKey);
                } else {
                    callback(error);
                }
            });
        } catch (error) {
            callback(error);
        }
    } else {
        console.log('Record already exists in JIRA - moving to the next step.');
        // if record already exists, edit might be required.
        editRequired = true;
        // mapping the SF Data to JIra columns for Edit
        jiraIssue.issueId = jiraIssueKey;
        jiraIssue.issue = {};
        jiraIssue.issue.fields = {};
        jiraIssue.issue.fields.description = "URL : " + requrl + sfData.Id + " " + sfData.User_Story2__c;
        jiraIssue.issue.fields.summary = sfData.Name;
        jiraIssue.issue.fields.customfield_10031 = sfData.Acceptance_Criteria__c;
        jiraIssue.issue.fields.customfield_10044 = sfData.Functional_Area__c;
        jiraIssue.issue.fields.customfield_10045 = sfData.Primary_Track__r.Name;
		
		if(sfData.Business_Owner__c !=null)
			jiraIssue.issue.fields.customfield_10057 = sfData.Business_Owner__r.Name;
		//********IMPORTANT STEPS TO FIND SPRINT IDS**************
		// the Sprints should be created in the resprctive project boards
		// use the following URL to fetch the board ids https://finastra.atlassian.net/rest/agile/1.0/board
	// then for the board id fetch all the sprints using https://finastra.atlassian.net/rest/agile/1.0/board/{RELACE WITH BOARD ID eg 15}/sprint
		
		// then update the below code for the sprint ID mappings
		/////////////////**********************//////
		
		if (sfData.Development_Sprint__c == "Sprint 1")
			setSprintID=19;
		else if (sfData.Development_Sprint__c == "Sprint 2")
			setSprintID=20;
		else if (sfData.Development_Sprint__c == "Sprint 3")
			setSprintID=21;
		else if (sfData.Development_Sprint__c == "Sprint 4")
			setSprintID=22;
		else if (sfData.Development_Sprint__c == "Sprint 5")
			setSprintID=23;
		else if (sfData.Development_Sprint__c == "Sprint 6")
			setSprintID=24;
		else
			setSprintID=null;
		jiraIssue.issue.fields.customfield_10021=setSprintID;
		
		//User Mapping for Assignee fields
		var assignIssue = {};
		var assigneeName=null;		
		if(sfData.Development_Owner__c != null){
			
			assigneeName=userMap.get(sfData.Development_Owner__r.Name);
			if(assigneeName == null)
			{
				jiraIssue.issue.fields.assignee=null;
			}
			else{
				assignIssue.name=assigneeName;
				jiraIssue.issue.fields.assignee=assignIssue;
			}
			
		}
		else 
			jiraIssue.issue.fields.assignee=null;
		///User mapping ends
		
		reporter.name='Gunish1';
		jiraIssue.issue.fields.reporter=reporter;	
        callback(null, sfRecordId, editRequired, jiraIssue, jiraIssueKey);

    }
}

function editRecordInJira(sfRecordId, editRequired, jiraIssue, jiraIssueKey, callback) {
    // if there is no edit required - move to the next step
    // console.log("Edit Required>>>>" + editRequired);
    console.log('Step 3');
    if (!editRequired) {
        // Move to the next step. No update to JIRA required. 
        console.log('No edit required - moving to the transition step');
        callback(null, sfRecordId, editRequired, jiraIssue, jiraIssueKey);
    } else {
        // Make a update on JIRA and then move to the next step.
        try {
            jira.issue.editIssue(jiraIssue, function(error, success) {
                if(!error) {
                    console.log('Issue updated successfully');
                    callback(null, sfRecordId, editRequired, jiraIssue, jiraIssueKey)
                } else {
                   callback('Error updating existing jira issue - ' + error);
                }
            });
        } catch (error) {
            callback(error)
        }
    }
}

function updateTransitionInJira(sfRecordId, editRequired, jiraIssue, jiraIssueKey, callback) {
    console.log('Step 4');
    // console.log(">>>> Transition jiraIssue.issueId>>" + jiraIssue.issueId);
    //jiraIssue.issueId = mapOfSFRecords.get(sfRecordId);

    var sfData = mapOfSFRecords.get(sfRecordId);
    var devStatus = "";
    // console.log(">>>" + sfData.Name);
    if (sfData.Development_Status__c == "Not Started") {
        devStatus = '11';
    } else if (sfData.Development_Status__c == "In Progress") {
        devStatus = '181';
    } else if (sfData.Development_Status__c == "On Hold") {
        devStatus = '71';
    } else if (sfData.Development_Status__c == "Ready for Internal QA") {
        devStatus = '191';
    } else if (sfData.Development_Status__c == "In Testing") {
        devStatus = '201';
    } else if (sfData.Development_Status__c == "Bug/Defect") {
        devStatus = '171';
    } else if (sfData.Development_Status__c == "Closed/Implemented") {
        devStatus = '221';
    } else if (sfData.Development_Status__c == "Development Under Review") {
        devStatus = '71';
    } else {
        //console.log('inside else');
        devStatus = '11';
    }

    console.log('issue id - ' + jiraIssueKey);
    // jiraIssue.issueId = {};
    // jiraIssue.iss
    jiraIssue.transition = {};
    jiraIssue.transition.id = devStatus;

    var transitionIssue = {};
    transitionIssue.issueId = jiraIssueKey;
    transitionIssue.transition = {};
    transitionIssue.transition.id = devStatus;

    // console.log("Dev Status" + devStatus);
    console.log('Going to transition now');
    try {
        console.log(JSON.stringify(transitionIssue));
        jira.issue.transitionIssue(transitionIssue, function(error, success) {

            console.log('Transition executed');
            // console.log("error Edit Transition>>>>>>>" + JSON.stringify(error));
            // console.log("success Edit Transition>>>>>>>" + JSON.stringify(success));
            if(!error) {
                console.log('Issue transitioned successfully');
                console.log('-----DONE-----');
                console.log('');
                callback(null, 'done');
            }  else {
                console.log('Error while transitioning issue - ' + JSON.stringify(error));
                console.log('-----DONE-----');
                console.log('');
                callback('Error while transitioning issue ' + JSON.stringify(error));
            }
        });
    } catch (error) {
        callback('Unexpected error while updating transition' + error);
    }
}

startProcess();