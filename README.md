# Read with Your Voice (Back-end API)

Read with Your Voice is a website that allows users to record their own voice in [Toki Pona language](http://tokipona.org/). After recording the voice, it's able to synthesize arbitrary Toki Pona text.

This repository contains the back-end of this project. [The repo of the front-end of this project is available here](https://github.com/SadaleNet/ReadWithYourVoice).

# Live Demo

Live demo is available here: [https://voice.sadale.net](https://voice.sadale.net)

# Technical Notes

The back-end of this website is a Node.js script developed with ExpressJS framework.

# Configuration

The configuration is available in private/config.json. The possible configuration parameters are shown below:

`dataDir` (required) - Path to the public data directory. It contains the audio clips of each word and the public metadata of the voice, like the name of the voice. For example, it can be `./private/data`. **If you're using an external server to serve the content of this directory, be sure to disable ranged HTTP request. Otherwise the audio files may only get partially loaded on the client side**

`privateDataDir` (required) - Path to the private data directory. It contains the raw audio clips and the private metadata of the voice, like the token of the voice. For example, it can be `./private/data-private`

`domain` (required) - The domain name of the front-end website. It's used for CORS handling.

`port` (required) - The port that the server would be listening to. Numeric value.

`captchaSecret` (optional) - the recaptcha secret key. If captcha isn't needed, `captchaSecret` should be removed from the configuration file.

`threshold` (optional) - The silence threshold of audio clips. Defaults to `-40.0`. Any audio lower than this value would be regarded as silence and trimmed.

# Deployment

To perform deployment, run `npm install`. After that, run `node app.js` and that's it.

# License

The files inside this repository is released under BSD 2-clause license.
