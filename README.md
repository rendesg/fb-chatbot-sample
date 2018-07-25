# Simple FB ChatBot 

Based on official FB Tutorial: https://github.com/fbsamples/messenger-platform-samples/tree/tutorial-starters/quick-start

## Prerequisite

A FB Page and App with the proper rights, Page Access Token & Verify Token.

NodeJS v8: https://nodejs.org/en/

A publicly available webserver with https where you can deploy & run the application.

## Functionality and Endpoints

The ChatBot itself can respond to two basic messages after setup:

* 'torma': sends a wikipedia article about torma
* 'horseradish': sends a wikipedia article about horseradish
 
in any other case it responds with a generic message.

Endpoints provided by the nodejs application:

* Verify Token
  * GET http://localhost:1337/webhook
  * parameters
    * hub.mode=subscribe
    * hub.verify_token=YOUR_VERIFY_TOKEN
    * challenge=<random_challenge>
* Handling Webhook events 
   * POST http://localhost:1337/webhook
   * Payload: various & provided by Facebook, check API
* Create Broadcast
  * POST http://localhost:1337/create-broadcast
  * payload:
	 * message: text of the broadcast message
  * returns id of the new broadcast	 
* Send Broadcast
  * POST http://localhost:1337/send-broadcast
  * payload
    * message_creative_id: <id of the broadcast>
    * schedule_time: optional, timestamp in ISO8601 format e.g. "2018-07-07T12:15:00+02:00"  
* Set GetStarted button
  * POST http://localhost:1337/set-get-started
  * payload: none

## Configuration

Copy config.json.sample as config.json, edit and enter your token values accordingly.

## Usage

Install

```
npm i
```

Run
```
npm run start
```

## PostMan

There is also a PostMan collection which contains sample requests.


