// The Cloud Functions for Firebase SDK to create Cloud Functions and setup triggers.
const functions = require('firebase-functions');

const express = require('express');
const cors = require('cors');
const app = express();

const base64url = require('b64url');
var crypto = require('crypto');

const app_secret = 'f1d038b8543c2d6fc7e9d0796a29ed3e' //fb app secret

function parse_signed_request(signed_request, secret) {
    encoded_data = signed_request.split('.',2);
    // decode the data
    sig = encoded_data[0];
    json = base64url.decode(encoded_data[1]);
    data = JSON.parse(json); // ERROR Occurs Here!

    // check algorithm - not relevant to error
    if (!data.algorithm || data.algorithm.toUpperCase() != 'HMAC-SHA256') {
        console.error('Unknown algorithm. Expected HMAC-SHA256');
        return null;
    }

    // check sig - not relevant to error
    expected_sig = crypto.createHmac('sha256',secret).update(encoded_data[1]).digest('base64').replace(/\+/g,'-').replace(/\//g,'_').replace('=','');
    if (sig !== expected_sig) {
        console.error('Bad signed JSON Signature!');
        return null;
    }

    return data;
}

// The Firebase Admin SDK to access the Firebase Realtime Database.
const admin = require('firebase-admin');
admin.initializeApp();

let db = admin.firestore();

// Automatically allow cross-origin requests
app.use(cors({ origin: true }));

app.post('/', (req, res) => {
    const body = req.body
    console.log('req',body)

    const parsed_data = parse_signed_request(body.signed_request, app_secret)

    console.log(parsed_data)

    var storesRef = db.collection("Stores");

    var query = storesRef.where("fbPageId", "==", parsed_data.page.id);
    
    query
        .get()
        .then(function(querySnapshot) {
            querySnapshot.forEach(function(doc) {
                // doc.data() is never undefined for query doc snapshots
                console.log(doc.id, " => ", doc.data());
                res.redirect(doc.data().url); 
            });
            // const doc = querySnapshot[0]
            // console.log(doc.id, " => ", doc.data());
            // res.redirect(doc.data().url); 
        })
    

     
    // res.end("Received POST request!");  

});

// Expose Express API as a single Cloud Function:
exports.integrate = functions.https.onRequest(app);
