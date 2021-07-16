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

var arguments = process.argv;
var carID = arguments[2];
console.log('Watcher script started. Watching vehicle: ', carID);

const {
  updateTokenFromCode,
  refreshToken,
  doStopEngine,
  checkStopEngine,
  getDetails,
  doLocation,
  getLocation
} = require('./fordConnect');


async function getNewRefreshToken(){
    await refreshToken();
}

//getNewRefreshToken().catch((err) => console.error(`An error occurred: ${err}`));

MongoClient.connect(url, function(err, db) {
    if(err) throw err;
    var dbo = db.db("ford_db");
    dbo.collection("vehicles").find({vehicleid: carID}).toArray(function(err, result) {
        if(err) throw err;
        watchCar(result[0]);
        db.close();
    });
    //db.close();
});

async function watchCar(carData) {
    await getNewRefreshToken().catch((err) => console.error(`An error occurred: ${err}`));

    var carGarageLat = carData.homeGPS.latitude;
    var carGarageLon = carData.homeGPS.longitude;
    carGarageLat = carGarageLat.substring(0, carGarageLat.indexOf('.') + 3);
    carGarageLon = carGarageLon.substring(0, carGarageLon.indexOf('.') + 3);

    console.log("Sleeping 5 seconds before checking if car is still idling");
    await sleep(5000);
    console.log("Checking status again");
    let response = await getDetails(carData.vehicleid);

    var carID = response.body.vehicle.vehicleId;
    var engineStatus = response.body.vehicle.vehicleStatus.remoteStartStatus.status;
    var carLatitude = response.body.vehicle.vehicleLocation.latitude;
    carLatitude = carLatitude.substring(0, carLatitude.indexOf('.') + 3);

    var carLongitude = response.body.vehicle.vehicleLocation.longitude;
    carLongitude = carLongitude.substring(0, carLongitude.indexOf('.') + 3);
    var carSpeed = response.body.vehicle.vehicleLocation.speed;

    if(engineStatus == "ENGINE_RUNNING" && carLatitude === carGarageLat && carLongitude === carGarageLon && carSpeed == "0.0") {
        console.log('Sending CO alert text');
        sendSms(carData.phone, 'Your engine has been idling at home. If this is intentional, please text back LETMEIDLE, or else we will remote shutdown the engine in 5 minutes');

        console.log('Waiting 10 seconds for confirmation text');
        await sleep(10000);

        response = await getDetails(carData.vehicleid);
        carID = response.body.vehicle.vehicleId;
        engineStatus = response.body.vehicle.vehicleStatus.remoteStartStatus.status;
        carLatitude = response.body.vehicle.vehicleLocation.latitude;
        carLatitude = carLatitude.substring(0, carLatitude.indexOf('.') + 3);
        carLongitude = response.body.vehicle.vehicleLocation.longitude;
        carLongitude = carLongitude.substring(0, carLongitude.indexOf('.') + 3);
        carSpeed = response.body.vehicle.vehicleLocation.speed;
        var commandId;

        if(engineStatus == "ENGINE_RUNNING" && carLatitude === carGarageLat && carLongitude === carGarageLon && carSpeed == "0.0") {
            MongoClient.connect(url, function(err, db) {
                if(err) throw err;
                var dbo = db.db("ford_db");
                dbo.collection("vehicles").find({vehicleid: carID}).toArray(async function(err, result) {
                    if(err) throw err;
                    if(result[0].confirmationTextReceived === false){
                        console.log('Stopping the engine');
                        response = await doStopEngine(carID);
                        ({ commandId } = response.body);
			console.log("Engine has been stopped!");
                        //console.log("sleeping 2 seconds while engine stops")
                        //await sleep(2000); //wait 5 seconds for car modem to receive signal
                        //console.log("checking stop status");
                        //response = await checkStopEngine(carID, commandId);
                        //console.log(response);
                        //if stopEngine fails, send error alert. SendSMS to 911
                    }
                    db.close();
                });
            });
        }

    }
    MongoClient.connect(url, function(err, db) {
        if(err) throw err;
        var dbo = db.db("ford_db");
        var myquery = { vehicleid: carID };
        var newvalues = { $set: {beingWatched: false} };
        dbo.collection("vehicles").updateOne(myquery, newvalues, function(err, res) {
            if (err) throw err;
            console.log("Reset car DB flags to false");
            db.close();
        });
    });
}
