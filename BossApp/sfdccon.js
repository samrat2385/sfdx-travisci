
var async = require('async');
var request = require('request');
const JiraClient = require('jira-connector');

var jiraExtIdMap = new Map();
var reqArray=[];

const jira = new JiraClient({
    host: 'finastra.atlassian.net',
    basic_auth: {
        username: 'gunish@cloudsandbox.com',
        password: 'qqc0z2djEU9VHdm2blM649FB'
    }
});
var jsforce = require('jsforce');
var conn = new jsforce.Connection({
  // you can change loginUrl to connect to sandbox or prerelease env.
   loginUrl : 'https://test.salesforce.com'
});


conn.login('samrat.chakraborty@finastra.com.findev', 'Newuser33#90bZMHtf6Xan8T6ivZDVAnNQH', function(err, userInfo) {
  if (err) { return console.error(err); }
			
			console.log('Trying connection');
            connectToJira();
			
  
});

function updateSalesforce(reqArray){
	console.log("I am here");
	var sfRecArray=[];
	//console.log(reqArray);	
	for(let sfIssue of reqArray)
	{
       // console.log("printing contents"+sfIssue.fields.customfield_10032);
        //sfRecArray.Acceptance_Criteria__c=sfIssue.fields.customfield_10031;*/
        if(sfIssue.fields.customfield_10032!=null ){
         sfRecArray.push({
             Id:sfIssue.fields.customfield_10032,
             Proposed_Solution__c:sfIssue.fields.summary
         });
        }
       
    }
    console.log(sfRecArray.length);

   /* conn.sobject('Requirements__c')
  .update(
    sfRecArray,
    { allOrNone: true },
    function(err, rets) {
      if (err) { return console.error(err); }
      console.log('processed: ' + rets.length);
    }
  );*/
}

function connectToJira() {
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

    request(`https://finastra.atlassian.net/rest/api/3/search?jql=type=Story%20AND%20project%20="Rubix"%20AND%20"BOSS%20Epic"%20~%20"LnE%20Billing"`, options, function(error, response, body) {
        var temp = JSON.parse(body);
		var flag =0;
        console.log('body:', temp.issues.length); // Print the HTML for the Google homepage.
        if (temp.issues.length > 0 ) {
            for (let singleIssue of temp.issues) {
            if(singleIssue.fields.customfield_10032!=null ){
					jiraExtIdMap.set(singleIssue.fields.customfield_10032, singleIssue);
					//updateSalesforce(jiraExtIdMap);
			}
				

            }
            //checkIfExisting(jiraExtIdMap);
            let total = temp.total;
            let runAgain = total - maxResults;
			//console.log("Run Again"+runAgain);
            if (runAgain > 0) {
                startAt = maxResults;
                doLoopAgain(startAt);
            }
            else
            {
                console.log("Inside Else");
                reqArray=Array.from(jiraExtIdMap.values());
				
				updateSalesforce(reqArray);	
            }
            
        } else if (temp.issues.length == 0) {
			//console.log("Show total count 2"+jiraExtIdMap.size);
												
        }
		else if(temp.issues.length != 0 && temp.total<maxResults)
		{
			//console.log("Show total count 3"+jiraExtIdMap.size);
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

    request(`https://finastra.atlassian.net/rest/api/3/search?jql=type=Story%20AND%20project%20="Rubix"%20AND%20"BOSS%20Epic"%20~%20"LnE%20Billing"&startAt=${startAt}`, options, function(error, response, body) {
        var temp = JSON.parse(body);
        if (temp.issues.length > 0) {
            for (let singleIssue of temp.issues) {
					if(singleIssue.fields.customfield_10032!=null){
						
					jiraExtIdMap.set(singleIssue.fields.customfield_10032, singleIssue);
				}   
			}
			
			//console.log("Show total count"+jiraExtIdMap.size);
            //checkIfExisting(jiraExtIdMap);
            let total = temp.total;
		//	console.log("start"+start);
		//	console.log("max"+maxResults);
            if (start + maxResults < total) {
                doLoopAgain(start + maxResults);
            }
		   if(jiraExtIdMap.size==total)
		   {
			   
			   //console.log(">>>>"+jiraExtIdMap);
				//console.log(jiraExtIdMap.values());
				reqArray=Array.from(jiraExtIdMap.values());
				
				updateSalesforce(reqArray);				
				
		   }
        }
    });

}
