/*
Copyright 2019 Wong Cho Ching <https://sadale.net>

Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:

1. Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.

2. Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*/

const express = require("express");
const Recaptcha = require('recaptcha-verify');
const uuidV1 = require('uuid/v1');
const crypto = require('crypto')
const bodyParser = require('body-parser')
const app = express();
const fs = require('fs');
const child_process = require('child_process');
const path = require('path');
const config = require('./private/config.json');

if(!("dataDir" in config)){
	console.error("Error: 'dataDir' not found in config.json");
	process.exit(1);
}

if(!("port" in config)){
	console.error("Error: 'port' not found in config.json");
	process.exit(1);
}

if(!("threshold" in config)){
	config.threshold = -40.0;
}

if(!("domain" in config)){
	console.error("Error: 'domain' not found in config.json");
	process.exit(1);
}

const recaptcha = ("captchaSecret" in config) ?
	new Recaptcha({secret: config.captchaSecret}) :
	null;

const recordableSentences = [
	"o* kepeken* telo* moli* lon* ma* ali* ni* !",
	"pipi* mute* li* pini* tawa* tomo* leko* mi* a* !",
	"kon* sewi* li tawa wawa* e* ko* walo* .",
	"mun* jelo* li pana* e suno* lon tenpo* pimeja* .",
	"lupa* open* la* akesi* li nasa* .",
	"kala* li lon insa* poki* li mu* .",
	"soweli* loje* li lukin* e kasi* suwi* .",
	"jan* pona* li wile* ala* unpa* e waso* .",
	"soweli luka* tu* li utala* tan* kili* .",
	"jaki* li lon sinpin* anpa* mi la mi weka* .",
	"mi en* sina* taso* li toki* .",
	"jan lawa* li alasa* kepeken oko* .",
	"jan li noka* e nena* li pilin* ike* .",
	"jan sama* li awen* lape* lon supa* .",
	"pata* mama* li ante* e moku* li namako* e ona* .",
	"esun* len* li jo* e kiwen* kule* .",
	"kulupu* mani* sin* li pali* kepeken ilo* sona* .",
	"nimi* apeja* en nimi kipisi* li pu* ala .",
	"selo* pakala* nanpa* wan* li suli* kin* .",
	"pan* sike* li lon poka* sijelo* mi .",
	"ijo* monsi* li seli* anu* lete* ?",
	"palisa* mije* li ken* kama* linja* .",
	"lipu* sitelen* pi* uta* meli* li lili* .",
	"monsuta* laso* li olin* e seme* ?",
	"mi kute* e kalama* musi* ale* lon nasin* .",
	"a-* a_* e-* e_* i-* i_* o-* o_* u-* u_*",
	"an-* an_* en-* en_* in-* in_* on-* on_* un-* un_*",
	"pa-* pa_* pe-* pe_* pi-* pi_* po-* po_* pu-* pu_*",
	"pan-* pan_* pen-* pen_* pin-* pin_* pon-* pon_* pun-* pun_*",
	"ta-* ta_* te-* te_* ti-* ti_* to-* to_* tu-* tu_*",
	"tan-* tan_* ten-* ten_* tin-* tin_* ton-* ton_* tun-* tun_*",
	"ka-* ka_* ke-* ke_* ki-* ki_* ko-* ko_* ku-* ku_*",
	"kan-* kan_* ken-* ken_* kin-* kin_* kon-* kon_* kun-* kun_*",
	"sa-* sa_* se-* se_* si-* si_* so-* so_* su-* su_*",
	"san-* san_* sen-* sen_* sin-* sin_* son-* son_* sun-* sun_*",
	"ma-* ma_* me-* me_* mi-* mi_* mo-* mo_* mu-* mu_*",
	"man-* man_* men-* men_* min-* min_* mon-* mon_* mun-* mun_*",
	"na-* na_* ne-* ne_* ni-* ni_* no-* no_* nu-* nu_*",
	"nan-* nan_* nen-* nen_* nin-* nin_* non-* non_* nun-* nun_*",
	"la-* la_* le-* le_* li-* li_* lo-* lo_* lu-* lu_*",
	"lan-* lan_* len-* len_* lin-* lin_* lon-* lon_* lun-* lun_*",
	"wa-* wa_* we-* we_* wi-* wi_* wo-* wo_* wu-* wu_*",
	"wan-* wan_* wen-* wen_* win-* win_* won-* won_* wun-* wun_*",
	"ja-* ja_* je-* je_* ji-* ji_* jo-* jo_* ju-* ju_*",
	"jan-* jan_* jen-* jen_* jin-* jin_* jon-* jon_* jun-* jun_*"
];

const MAX_VOICE_NAME_LENGTH = 128;

//CORS handler
app.use(function(req, res, next) {
	res.header("Access-Control-Allow-Origin", config.domain);
	res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
	next();
});

//Error handler
app.use(function (err, req, res, next) {
	console.error(err.stack)
	res.status(500).json({errorMessage: "Server error. ijo ike li kama lon ilo sona mi."})
});

var jsonParser = bodyParser.json({limit: '500kb', extended: true});

app.listen(config.port, () => {
	console.log("Server running!");
});

//Handle static files.
app.use(express.static(config.dataDir, {acceptRanges: false}));

function waitMultipleCommandsFactory(numberOfCommands, next){
	let commandCompletionCount = 0;
	let errorOccured = false;
	return (error, stdout, stderr) => {
		if(errorOccured)
			return;
		if(error){
			errorOccured = true;
			next(error);
		}else if(++commandCompletionCount >= numberOfCommands){
			next();
		}
	}
}

const readPrivateMetadataAndValidateToken = [
	function(req, res, next){
		res.locals.filePath = path.join(config.privateDataDir, req.params.voiceId, "metadata.json");
		fs.access(res.locals.filePath, fs.constants.R_OK, next);
	},
	function(req, res, next){
		fs.readFile(res.locals.filePath, 'utf8', (err, content) => { res.locals.privateMetadata = content; next(err) });
	},
	function(req, res, next){
		res.locals.privateMetadataObj = JSON.parse(res.locals.privateMetadata);
		if(res.locals.privateMetadataObj.token === req.body.token)
			next();
		else
			res.status(400).json({errorMessage: "Invalid token"});
	}
];

const readPublicMetadata = [
	function(req, res, next){
		res.locals.filePath = path.join(config.dataDir, req.params.voiceId, "metadata.json");
		fs.access(res.locals.filePath, fs.constants.R_OK, next);
	},
	function(req, res, next){
		fs.readFile(res.locals.filePath, 'utf8', (err, content) => { res.locals.metadataObj = JSON.parse(content); next(err) });
	}
];

app.post("/api/kalama-sin", jsonParser,
	function(req, res, next){
		//Input sanitization
		if(!("name" in req.body) || (typeof req.body.name != "string") || req.body.name.length<0 || req.body.name.length>=MAX_VOICE_NAME_LENGTH ||
			!("stressedFrequency" in req.body) || (typeof req.body.stressedFrequency != "number") ||
			!("unstressedFrequency" in req.body) || (typeof req.body.unstressedFrequency != "number") ||
			!("durationValue" in req.body || (typeof req.body.durationValue != "number") || req.body.durationValue <= 0) ||
			!("captchaToken" in req.body) || (typeof req.body.captchaToken != "string")
		){
			res.status(400).json({errorMessage: "Error on user input. sina pana e ijo ike."});
		}else{
			next();
		}
	},
	function(req, res, next){
		if(recaptcha === null){
			next(); //Captcha isn't enabled. Bypassing.
		}else{
			recaptcha.checkResponse(req.body.captchaToken, function(captchaError, captchaResponse){
				//Confirm that the captcha is a valid one.
				if(captchaError || !captchaResponse.success){
					res.status(400).json({errorMessage: "Captcha error!"})
				}else{
					next();
				}
			});
		}
	},
	//Generate uuid and token
	function(req, res, next){
		res.locals.id = uuidV1();
		res.locals.token = crypto.randomBytes(16).toString('hex');
		next();
	},
	//Write the publi metadata file
	function(req, res, next){
		fs.mkdir(path.join(config.dataDir, res.locals.id), { recursive: true }, next);
	},
	function(req, res, next){
		const metaData = {
			name: req.body.name,
			stressedFrequency: req.body.stressedFrequency,
			unstressedFrequency: req.body.unstressedFrequency,
			durationValue: req.body.durationValue,
		};
		fs.writeFile(
			path.join(config.dataDir, res.locals.id, "metadata.json"),
			JSON.stringify(metaData),
			next);
	},
	//Write the privatem metadata file
	function(req, res, next){
		fs.mkdir(path.join(config.privateDataDir, res.locals.id),
			{ recursive: true },
			next);
	},
	function(req, res, next){
		const privateMetaData = {
			token: res.locals.token,
			sentences: recordableSentences.map((x, i) => { return {id: i, sentence: x, recorded: ""}; })
		};
		fs.writeFile(
			path.join(config.privateDataDir, res.locals.id, "metadata.json"),
			JSON.stringify(privateMetaData),
			next);
	},
	//Respond to the client
	function(req, res, next){
		res.status(200).json({id: res.locals.id, token: res.locals.token});
	}
);

app.post("/api/:voiceId([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/get-private-metadata",
	jsonParser,
	readPrivateMetadataAndValidateToken,
	function(req, res, next){
		res.status(200).json(res.locals.privateMetadataObj);
	}
);

app.post("/api/:voiceId([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/send-audio",
	jsonParser,
	//Input validation
	function(req, res, next){
		if(
		!("token" in req.body) || (typeof req.body.token != "string") || req.body.token.length<0 ||
		!("sentenceId" in req.body) || (typeof req.body.sentenceId != "number") ||
		!("audio" in req.body) || (typeof req.body.audio != "string") || req.body.audio.length<0
		)
			res.status(400).json({errorMessage: "Error on user input. sina pana e ijo ike."});
		else
			next();
	},
	//Reads private metadata and validate token
	readPrivateMetadataAndValidateToken,
	//Validate sentenceId
	function(req, res, next){
		if(req.body.sentenceId in res.locals.privateMetadataObj.sentences)
			next();
		else
			res.status(400).json({errorMessage: "Invalid sentenceId"});
	},
	//Reads public metadata
	readPublicMetadata,
	//Saves the audio clip
	function(req, res, next){
		res.locals.audioFileName = `${req.body.sentenceId}-${crypto.randomBytes(16).toString('hex')}.ogg`
		console.log("Saved: "+res.locals.audioFileName);
		fs.writeFile(
			path.join(config.privateDataDir, req.params.voiceId, res.locals.audioFileName),
			Buffer.from(req.body.audio, 'base64'),
			next);
	},
	//Create temporary directory as a sketchpad for audio clips processing
	function(req, res, next){
		fs.mkdtemp(
			path.join(config.privateDataDir, req.params.voiceId, res.locals.audioFileName+"-"),
			(err, content) => { res.locals.tempFolder = content; next(err) }
		);
	},
	//Split the audio clip by using SoX
	function(req, res, next){
		const sentence = res.locals.privateMetadataObj.sentences[req.body.sentenceId].sentence
		res.locals.words = sentence.replace(/[^A-Za-z\-_*]+/g, " ")
						.split(' ')
						.filter(word => word.length > 0);
		res.locals.numCapturingWords = sentence.match(/[*]/g).length;
		let currentTimeOffset = res.locals.metadataObj.durationValue*(8-1+1);

		//Command completion handling function
		const waitMultipleCommands = waitMultipleCommandsFactory(res.locals.numCapturingWords, next);
		//Loop thru each relevant words and split it
		for(let i=0; i<res.locals.words.length; i++){
			let word = res.locals.words[i];
			const numSyllable = word.match(/[aeiou]/gi).length;
			if(word.endsWith('*')){
				word = word.slice(0, -1);
				child_process.exec("sox "
					+path.join(config.privateDataDir, req.params.voiceId, res.locals.audioFileName)+" "
					+path.join(res.locals.tempFolder, word+".ogg")+" "
					+"trim "
					+(currentTimeOffset/1000)+" "
					+((res.locals.metadataObj.durationValue/1000)*(numSyllable+2))+" "
					+"silence "
					+"1 "
					+"0.001 "
					+config.threshold+"d "
					+"reverse "
					+"silence "
					+"1 "
					+"0.001 "
					+config.threshold+"d "
					+"reverse "
					,
					waitMultipleCommands
				);
			}

			if(numSyllable <= 2)
				currentTimeOffset += res.locals.metadataObj.durationValue *4
			else
				currentTimeOffset += res.locals.metadataObj.durationValue *6
		}
	},
	//Ensure that all split words audio files exist
	function(req, res, next){
		const waitMultipleCommands = waitMultipleCommandsFactory(res.locals.numCapturingWords, next);

		for(let i=0; i<res.locals.words.length; i++){
			let word = res.locals.words[i];
			if(word.endsWith('*')){
				word = word.slice(0, -1);
				fs.access(res.locals.filePath, fs.constants.R_OK, waitMultipleCommands);
			}
		}
	},
	//Move the files into the data directory
	function(req, res, next){
		const waitMultipleCommands = waitMultipleCommandsFactory(res.locals.numCapturingWords, next);

		for(let i=0; i<res.locals.words.length; i++){
			let word = res.locals.words[i];
			if(word.endsWith('*')){
				word = word.slice(0, -1);
				fs.rename(
					path.join(res.locals.tempFolder, word+".ogg"),
					path.join(config.dataDir, req.params.voiceId, word+".ogg"),
					waitMultipleCommands
				);
			}
		}
	},
	//Remove the temporary directory
	function(req, res, next){
		fs.rmdir(path.join(res.locals.tempFolder), next);
	},
	//Update the private metadata
	function(req, res, next){
		res.locals.privateMetadataObj.sentences[req.body.sentenceId].recorded = res.locals.audioFileName;
		fs.writeFile(
			path.join(config.privateDataDir, req.params.voiceId, "metadata.json"),
			JSON.stringify(res.locals.privateMetadataObj),
			next);
	},
	function(req, res, next){
		res.status(200).json(res.locals.privateMetadataObj);
	}
);

app.post("/api/:voiceId([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/update-name",
	jsonParser,
	//Input validation
	function(req, res, next){
		if(
		!("token" in req.body) || (typeof req.body.token != "string") || req.body.token.length<0 || req.body.name.length>=MAX_VOICE_NAME_LENGTH ||
		!("name" in req.body) || (typeof req.body.name != "string") || req.body.name.length<0
		)
			res.status(400).json({errorMessage: "Error on user input. sina pana e ijo ike."});
		else
			next();
	},
	//Reads private metadata and validate token
	readPrivateMetadataAndValidateToken,
	//Read the public metadata
	readPublicMetadata,
	//Update the name in public metadata
	function(req, res, next){
		res.locals.metadataObj.name = req.body.name
		fs.writeFile(
			path.join(config.dataDir, req.params.voiceId, "metadata.json"),
			JSON.stringify(res.locals.metadataObj),
			next);
	},
	function(req, res, next){
		res.status(200).json({});
	}
);
