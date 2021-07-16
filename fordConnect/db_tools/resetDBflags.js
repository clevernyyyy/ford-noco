var MongoClient = require('mongodb').MongoClient;
var url = "mongodb://localhost:27017/";

MongoClient.connect(url, function(err, db) {
    if(err) throw err;
    var dbo = db.db("ford_db");
    var myquery = { phone: '14026304979' };
    var newvalues = { $set: {beingWatched: false, confirmationTextReceived: false} };
    dbo.collection("vehicles").updateOne(myquery, newvalues, function(err, res) {
        if (err) throw err;
        console.log("1 document updated");
        db.close();
    });
});
