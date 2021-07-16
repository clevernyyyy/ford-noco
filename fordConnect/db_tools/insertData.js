var MongoClient = require('mongodb').MongoClient;
var url = "mongodb://localhost:27017/";

MongoClient.connect(url, function(err, db) {
  if (err) throw err;
  var dbo = db.db("ford_db");
  var myobj = { vehicleid: "8a7f9fa878849d8a0179579d2f26043a", phone: "14028892440", name: "John Doe", address: "123 Main St", beingWatched: false, confirmationTextReceived: false,
                homeGPS: { longitude: "-83.204973", latitude: "42.300158" } };
  dbo.collection("vehicles").insertOne(myobj, function(err, res) {
    if (err) throw err;
    console.log("1 document inserted");
    db.close();
  });
}); 
