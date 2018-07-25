'use strict';

var config = require('./config.json');

// reading config variables 
const PAGE_ACCESS_TOKEN = config["PAGE_ACCESS_TOKEN"] || process.env.PAGE_ACCESS_TOKEN ;
const VERIFY_TOKEN = config["VERIFY_TOKEN"] || process.env.VERIFY_TOKEN ;

if (!PAGE_ACCESS_TOKEN) {
	console.log('Page Access Token is not set - exiting');
	process.exit(-1);
}
if (!VERIFY_TOKEN) {
	console.log('Verify Token is not set - exiting');
	process.exit(-1);
}

console.log('Tokens are present, setting up endpoints');

// Imports dependencies and set up http server
const
  request = require('request'),
  express = require('express'),
  bodyParser = require('body-parser'),
  app = express().use(bodyParser.json()); // creates express http server

// Sets server port and logs message on success
app.listen(process.env.PORT || 1337, () => console.log('webhook is listening'));

// Creates the endpoint for our webhook 
app.post('/webhook', (req, res) => {  
 
  let body = req.body;

  // Checks this is an event from a page subscription
  if (body.object === 'page') {

    // Iterates over each entry - there may be multiple if batched
    body.entry.forEach(function(entry) {
		
	  if (!entry.messaging) return;
	  
      // Gets the message. entry.messaging is an array, but 
      // will only ever contain one message, so we get index 0	  	 
      let webhook_event = entry.messaging[0];
      console.log(webhook_event);
	  
	  // Get the sender PSID
      let sender_psid = webhook_event.sender.id;
      console.log('Sender ID: ' + sender_psid);

      // Check if the event is a message or postback and
      // pass the event to the appropriate handler function
      if (webhook_event.message) {
        handleMessage(sender_psid, webhook_event.message);        
      } else if (webhook_event.postback) {
        handlePostback(sender_psid, webhook_event.postback);
      } else if (webhook_event.delivery) {
        console.log('Delivery event!');
      } else if (webhook_event.read) {
        console.log('Read event!');
      }
    });

    // Returns a '200 OK' response to all requests
    res.status(200).send('EVENT_RECEIVED');
  } else {
	console.log("unknown webhook message", body);
    // Returns a '404 Not Found' if event is not from a page subscription
    res.sendStatus(404);
  }

});

// Adds support for GET requests to our webhook
app.get('/webhook', (req, res) => {

  // Parse the query params
  let mode = req.query['hub.mode'];
  let token = req.query['hub.verify_token'];
  let challenge = req.query['hub.challenge'];
  
  console.log(req.query);
  console.log(req.query['hub.mode']);
    
  // Checks if a token and mode is in the query string of the request
  if (mode && token) {
  
    // Checks the mode and token sent is correct
    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      
      // Responds with the challenge token from the request
      console.log('WEBHOOK_VERIFIED');
      res.status(200).send(challenge);
    
    } else {
      // Responds with '403 Forbidden' if verify tokens do not match
      res.sendStatus(403);      
    }
  }
});

function handleMessage(sender_psid, received_message) {
  let response;
  
  // Checks if the message contains text
  if (received_message.text) {    
    // Create the payload for a basic text message, which
    // will be added to the body of our request to the Send API
    response = {
      "text": `You sent the message: "${received_message.text}". Now send me an attachment!`
    }
  } else if (received_message.attachments) {
    // Get the URL of the message attachment
    let attachment_url = received_message.attachments[0].payload.url;
    response = {
      "attachment": {
        "type": "template",
        "payload": {
          "template_type": "generic",
          "elements": [{
            "title": "Is this the right picture?",
            "subtitle": "Tap a button to answer.",
            "image_url": attachment_url,
            "buttons": [
              {
                "type": "postback",
                "title": "Yes!",
                "payload": "yes",
              },
              {
                "type": "postback",
                "title": "No!",
                "payload": "no",
              }
            ],
          }]
        }
      }
    }
  } 
  
  // Send the response message
  // callSendAPI(sender_psid, response);    
  
  if (received_message.text) {    
	  if (received_message.text.indexOf("torma") !== -1) {
		  response = {
			  "text": "Itt találsz több információt a tormáról: https://hu.wikipedia.org/wiki/Torma"
		  }
		  
		  callSendAPI(sender_psid, response);
	  } else if (received_message.text.indexOf("horseradish") !== -1) {
		  response = {
			  "text": "You can find more information about horseradish here: https://en.wikipedia.org/wiki/Horseradish"
		  }
		  
		  callSendAPI(sender_psid, response);
	  } else {
			response = {
				"text": "Sajnos ebben nem tudok segíteni, de az oldal munkatársai hamarosan jelentkeznek és válaszolnak! \n Szép napot, TormaBot \n\n\n Unfortunately, I cannot help you in this matter, but the staff of this site will be soon able answer and reply!  \n Nice day, TormaBot "
			}
		  
			callSendAPI(sender_psid, response);
	  }
  }
}

function handlePostback(sender_psid, received_postback) {
  console.log('ok')
   let response;
  // Get the payload for the postback
  let payload = received_postback.payload;

  // Set the response based on the postback payload
  if (payload === 'yes') {
    response = { "text": "Thanks!" }
  } else if (payload === 'no') {
    response = { "text": "Oops, try sending another image." }
  }
  // Send the message to acknowledge the postback
  callSendAPI(sender_psid, response);
}

function callSendAPI(sender_psid, response) {
  // Construct the message body
  let request_body = {
    "recipient": {
      "id": sender_psid
    },
    "message": response
  }

  // Send the HTTP request to the Messenger Platform
  request({
    "uri": "https://graph.facebook.com/v2.6/me/messages",
    "qs": { "access_token": PAGE_ACCESS_TOKEN },
    "method": "POST",
    "json": request_body
  }, (err, res, body) => {
    if (!err) {
      console.log('message sent!')
    } else {
      console.error("Unable to send message:" + err);
    }
  }); 
}

app.post('/create-broadcast', (req, res) => {  
  let body = req.body;
  
  let request_body = {    
    "messages": [{
		  "text": body.message
	  }]
  }  
  
  request({
    "uri": "https://graph.facebook.com/v2.11/me/message_creatives",
    "qs": { "access_token": PAGE_ACCESS_TOKEN },
    "method": "POST",
    "json": request_body
  }, (err, response, body) => {
    if (!err) {
      console.log('broadcast message created!')
	  res.status(200).send(response);
    } else {
      console.error("Unable to send message:" + err);
    }
  }); 
});

app.post('/send-broadcast', (req, res) => {  
  let body = req.body;
  
  let request_body = {    
    "message_creative_id": body.message_creative_id,
	"notification_type": "REGULAR",
	"messaging_type": "MESSAGE_TAG",
	"tag": "NON_PROMOTIONAL_SUBSCRIPTION",
	"schedule_time": body.schedule_time
  }

  request({
    "uri": "https://graph.facebook.com/v2.11/me/broadcast_messages",
    "qs": { "access_token": PAGE_ACCESS_TOKEN },
    "method": "POST",
    "json": request_body
  }, (err, response, body) => {
    if (!err) {
      console.log('broadcast message sent!')
	  res.status(200).send(response);
    } else {
      console.error("Unable to send message:" + err);
    }
  });   
});

app.post('/set-get-started', (req, res) => {  
  let body = req.body;
  
  let request_body = {    
    "get_started": {"payload": "woo-hoo"}
  }  
  
  request({
    "uri": "https://graph.facebook.com/v2.11/me/messenger_profile",
    "qs": { "access_token": PAGE_ACCESS_TOKEN },
    "method": "POST",
    "json": request_body
  }, (err, response, body) => {
    if (!err) {
      console.log('get started created!')
	  res.status(200).send(response);
    } else {
      console.error("Unable to create get started:" + err);
    }
  }); 
});

console.log('Endpoint setup success - ChatBot is operational');