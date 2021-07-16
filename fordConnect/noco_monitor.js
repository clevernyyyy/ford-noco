#!/usr/bin/node

const http = require('http');
const request = require('request');
const express = require('express');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
dotenv.config();
const path = require('path')
//require('dotenv').config({ path: path.resolve(__dirname, '../.env') })
const session = require('express-session');
const MessagingResponse = require('twilio').twiml.MessagingResponse;
const app = express();
const sendSms = require('./twilio');
var sleep = require('sleep-promise');
var MongoClient = require('mongodb').MongoClient;
var url = "mongodb://localhost:27017/";
var spawn = require('child_process').spawn;
app.use(session({secret: 'anything-you-want-but-keep-secretttt'}));
app.use( bodyParser.urlencoded( { extended: false } ) );

http.createServer(app).listen(1338,  () => {
  console.log('Express server listening on port 1338');
});

const {
  updateTokenFromCode,
  refreshToken,
  getVehicles,
  doStopEngine,
  checkStopEngine,
  doStatus,
  getStatus,
  getDetails,
  doLocation,
  getLocation,
} = require('./fordConnect');

async function getNewRefreshToken(){
    await refreshToken();
}

//getNewRefreshToken().catch((err) => console.error(`An error occurred: ${err}`));


//poll all vehicles in our database, every 2 min. Change to every 15min
//var poller = setInterval(pollVehicles, 1500);
var poller = pollVehicles();

async function pollVehicles() {
    console.log("Starting to poll all cars in the DB");

    //get a new token when the car polling loop restarts (every 15min)
    await getNewRefreshToken().catch((err) => console.error(`An error occurred: ${err}`));
	
    MongoClient.connect(url, function(err, db) {
        if(err) throw err;
        var dbo = db.db("ford_db");
        dbo.collection("vehicles").find({}).toArray(function(err, result) {
            if(err) throw err;

	    //send each car's info to carCheck function to check location and engine status
            result.forEach( carCheck );
            db.close();
        });
    });
}


async function carCheck(car, index, arr) {
    console.log("\n", "Sending vehicleInfo API call for vehicle:", car.vehicleid, "\n");
  
    let response = await getDetails(car.vehicleid);

    var carID = response.body.vehicle.vehicleId;
    var engineStatus = response.body.vehicle.vehicleStatus.remoteStartStatus.status;
    var carLatitude = response.body.vehicle.vehicleLocation.latitude;
    carLatitude = carLatitude.substring(0, carLatitude.indexOf('.') + 3);
    var carLongitude = response.body.vehicle.vehicleLocation.longitude;
    carLongitude = carLongitude.substring(0, carLongitude.indexOf('.') + 3);
    var carSpeed = response.body.vehicle.vehicleLocation.speed;


    MongoClient.connect(url, function(err, db) {
        if(err) throw err;
        var dbo = db.db("ford_db");
        dbo.collection("vehicles").find({vehicleid: carID}).toArray(function(err, result) {
            if(err) throw err;
            var carData = result[0];
            var carGarageLat = carData.homeGPS.latitude;
            var carGarageLon = carData.homeGPS.longitude;
            carGarageLat = carGarageLat.substring(0, carGarageLat.indexOf('.') + 3);
            carGarageLon = carGarageLon.substring(0, carGarageLon.indexOf('.') + 3);

            console.log("Car current location: ", carLatitude, " ", carLongitude, "\nHome garage location: ", carGarageLat, " ", carGarageLon);

            //look for cars that requested to stay running, but eventually turned the engine off. Reset their DB flags
            if(engineStatus != "ENGINE_RUNNING" && carData.confirmationTextReceived === true && beingWatched === false){
                var myquery = { vehicleid: carID };
                var newvalues = { $set: {confirmationTextReceived: false} };
                dbo.collection("vehicles").updateOne(myquery, newvalues, function(err, res) {
                    if (err) throw err;
                    console.log("Reset DB flags for vehicle that was requested to run but has since stopped: ", carID);
                });
            }

            console.log("\ncar watchstate: ", carData.beingWatched);
            //look for cars that are running, zero speed, and at their home address. If all true, send car Info to watcher script
            if(engineStatus == "ENGINE_RUNNING" && carData.beingWatched === false && carLatitude === carGarageLat && carLongitude === carGarageLon && carSpeed == "0.0") {
                console.log("Engine running at home address for car: ", carID);
                var myquery = { vehicleid: carID };
                var newvalues = { $set: {beingWatched: true} };
                dbo.collection("vehicles").updateOne(myquery, newvalues, async function(err, res) {
                    if (err) throw err;
                    console.log("Database flag beingWatched set to true for car: ", carID);
                });

                console.log("Sending car data to watcher script");
                let child = spawn('node', ['watcher.js', carID], { detached: false }); //should also send auth_token so each process uses same token
                child.stdout.on('data', (data) => { console.log(`Engine watcher:\n${data}`); });
            }
            //db.close();
        });
    });
}


const letMeIdleRegex = /^\s*LETMEIDLE\s*/i;

app.post('/smsIdle', (req, res) => {

    let smsText = req.body.Body;
    let phoneNum = req.body.From;
    phoneNum = phoneNum.replace(/\W/g, '');
    console.log('Text from: ' + phoneNum + '\n');

    let validText = false;

    MongoClient.connect(url, function(err, db) {
        if(err) throw err;
        var dbo = db.db("ford_db");
        dbo.collection("vehicles").find({phone: phoneNum}).toArray(function(err, result) {
            if(err) throw err; //phone number not registered. Send text indication: not registered????
            var carData = result[0];

            if(smsText.match(letMeIdleRegex)){
                validText = true;
                if(carData.beingWatched === false){
                    console.log("Received random text");
                    sendSms(carData.phone, 'No reason for you to be texting this service. Your car is not being watched');
                }
                if(carData.beingWatched === true){
                    console.log("Received confirmation text. Let engine idle");
                    sendSms(carData.phone, 'Thanks for replying. We will leave your car running');
                    var myquery = {phone: phoneNum};
                    var newvalues = { $set: {confirmationTextReceived: true} };
                    dbo.collection("vehicles").updateOne(myquery, newvalues, function(err, res) {
                        if (err) throw err;
                        console.log("1 document updated");
                        //db.close();
                    });
                }
            }
            //db.close();
        });
        //db.close();
    });
	console.log("Finished parsing text");
    //if(validText === false){ sendReply('Unrecognized command', res); }
});




/*
function sendReply( myData, myRes ){
    //console.log('sending text with data ' + myData);
    const twiml = new MessagingResponse();
    twiml.message(myData);

    myRes.writeHead(200, {'Content-Type': 'text/xml'});
    myRes.end(twiml.toString());
}
*/
