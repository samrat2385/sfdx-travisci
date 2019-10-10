
const JiraClient = require('jira-connector');
const jira = new JiraClient({
    host: 'finastra.atlassian.net',
    basic_auth: {
        username: 'gunish@cloudsandbox.com',
        password: 'TestPassword@123'
       
    }
});
console.log(jira);

const prjKey = 'RBX';
const prjName = 'Rubix';
const issueKey = 'Story';
const sfurl = 'https://test.salesforce.com';
const requrl = 'https://misys--findev.cs88.my.salesforce.com/';
const query = "SELECT Id,Name,Title__c, User_Story2__c,Acceptance_Criteria__c,Primary_Track__r.Name,Requirement_Status__c,Functional_Area__c, LastModifiedDate,Development_Status__c,Development_Sprint__c,Development_Owner__c,Development_Owner__r.Name,Business_Owner__c,Business_Owner__r.Name FROM Requirements__c where Primary_Track__c = 'a0r9E0000039qPRQAY' ORDER BY Name";
console.log('Got a response from salesforce, Number of records found outside- ');
function startProcess() {
	console.log('Got a response from salesforce, Number of records found - ');
    try {
        var conn = new jsforce.Connection({
            loginUrl: sfurl
        });
        conn.login('sujith.maruthingal@finastra.com.findev', 'Phoenix_77GkGu5Fc6nw6JahSGoLDc38hI2', function(err, result) {
			
            conn.query(query, function(err, response) {
                if (response) {
                    console.log('Got a response from salesforce, Number of records found - ' + response.records.length );         
                    //startJiraSync(response.records);
                } else {
                    // Error from Salesforce. 
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