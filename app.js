const express = require("express");
const Recaptcha = require('recaptcha-verify');
const uuidV1 = require('uuid/v1');
const crypto = require('crypto')
const bodyParser = require('body-parser')
const app = express();
const fs = require('fs');
const path = require('path');
const config = require('./private/config.json');

if(!("captchaSecret" in config)){
	console.log("Error: 'captchaSecret' not found in config.json");
	process.exit(1);
}

if(!("dataDir" in config)){
	console.log("Error: 'dataDir' not found in config.json");
	process.exit(1);
}

var recaptcha = new Recaptcha({
    secret: config.captchaSecret
});

app.use(function(req, res, next) {
	res.header("Access-Control-Allow-Origin", "http://localhost:3000");
	res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
	next();
});

var jsonParser = bodyParser.json();

app.listen(3001, () => {
	console.log("Server running!");
});

app.post("/api/kalama-sin", jsonParser, (request, response, next) => {
	//Input sanitization
	if(!("name" in request.body) || (typeof request.body.name != "string") || request.body.name.length<0 ||
		!("stressedFrequency" in request.body) || (typeof request.body.stressedFrequency != "number") ||
		!("unstressedFrequency" in request.body) || (typeof request.body.unstressedFrequency != "number") ||
		!("durationValue" in request.body || (typeof request.body.durationValue != "number") || durationValue <= 0) ||
		!("captchaToken" in request.body) || (typeof request.body.captchaToken != "string")
	){
        response.status(400).json({errorMessage: "Error on user input. sina pana e ijo ike."});
	}
 
    recaptcha.checkResponse(request.body.captchaToken, function(captchaError, captchaResponse){
		//Confirm that the captcha is a valid one.
//TODO: uncomment!        if(captchaError || !captchaResponse.success){
//TODO: uncomment!            response.status(400).json({errorMessage: "Captcha error!"});
//TODO: uncomment!            return;
//TODO: uncomment!        }

		let id = uuidV1();
		let token = crypto.randomBytes(16).toString('hex');
		
		fs.mkdir(path.join(config.dataDir, id), { recursive: true }, (err) => {
			if(err) throw err;
			const metaData = {
				name: request.body.name,
				stressedFrequency: request.body.stressedFrequency,
				unstressedFrequency: request.body.unstressedFrequency,
				durationValue: request.body.durationValue,
				token: token
			};
			fs.writeFile(
				path.join(config.dataDir, id, "metadata.json"),
				JSON.stringify(metaData),
				(err) => {
					if(err) throw err;
					response.status(200).json({id: id, token: token});
				});
		});

    });

});
