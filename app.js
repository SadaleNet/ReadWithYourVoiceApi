var express = require("express");
const uuidV1 = require('uuid/v1');
var bodyParser = require('body-parser')
var app = express();
const fs = require('fs');

app.use(function(req, res, next) {
	res.header("Access-Control-Allow-Origin", "http://localhost:3000");
	res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
	next();
});

var jsonParser = bodyParser.json();

app.listen(3001, () => {
	console.log("Server running!");
});

app.post("/kalama-sin", jsonParser, (request, response, next) => {
	console.log(request.body);
	console.log(uuidV1());
	response.json(["Tony","Lisa","Michael","Ginger","Food"]);
});
