const express = require('express');
const fs = require('fs');
const path = require('path');
const bodyParser = require('body-parser');
const http = require('http');
const https = require('https');
const SocketServer = require('./socketServer');
const url = require('url');
const { ARGS } = require('./consts');

// Path constants
const DIRECT_MOCK = '/direct-mock/';
const BROADCAST = '/broadcast/';

// process args
const args = require('./processArgs')(process.argv);

let configPath = args[ARGS.CONFIG] || args.defs[ARGS.CONFIG];
if (!path.isAbsolute(configPath)) {
  configPath = path.resolve(__dirname, configPath);
}

const config = require(configPath); // eslint-disable-line
const SOCKET_PORT = args[ARGS.SOCKET_PORT] || config.socketPort || args.defs[ARGS.SOCKET_PORT];
const PORT = args[ARGS.PORT] || config.port || args.defs[ARGS.PORT];

let MOCKS_PATH = args[ARGS.MOCKS] || config.mocks || args.defs[ARGS.MOCKS];
if (!path.isAbsolute(MOCKS_PATH)) {
  MOCKS_PATH = path.resolve(__dirname, MOCKS_PATH);
}

const API_URL = new url.URL(args[ARGS.API] || config.api || args.defs[ARGS.API]);
const RULES = config.rules || {};
const HTTPS = args[ARGS.HTTPS] || config.https || args.defs[ARGS.HTTPS];

console.log('api url:', API_URL.href);
console.log('mocks path:', MOCKS_PATH);
console.log('protocol:', HTTPS ? 'https' : 'http');

// init stuff
const app = express();
const socketServer = new SocketServer(SOCKET_PORT);
const cache = {};

if (HTTPS) {
  const httpsOptions = {
    key: fs.readFileSync(path.resolve(__dirname, './cert/key.pem')),
    cert: fs.readFileSync(path.resolve(__dirname, './cert/cert.pem')),
  };
  https.createServer(httpsOptions, app)
    .listen(PORT, () => console.log(`DEVELOPMENT-DEV-SERVER listening on port ${PORT}`));
} else {
  http.createServer(app)
    .listen(PORT, () => console.log(`DEVELOPMENT-DEV-SERVER listening on port ${PORT}`));
}

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: true,
}));

app.get('/*', processRequest);
app.post('/*', processRequest);

function processRequest(req, res) {
  res.set({
    'Access-Control-Allow-Origin': req.get('origin'),
    'Access-Control-Allow-Credentials': true,
  });
  if (req.url.indexOf(DIRECT_MOCK) !== -1) {
    const filePath = path.resolve(MOCKS_PATH, req.url.replace(DIRECT_MOCK, ''));
    console.log('Sending direct mock', filePath);
    res.sendFile(filePath);
  } else if (req.url.indexOf(BROADCAST) !== -1) {
    const event = req.url.replace(BROADCAST, '');
    console.log('Broadcasting event', event);
    socketServer.broadcastEvent(event);
    res.status(204).end();
  } else if (req.url === '/favicon.ico') {
    res.sendFile(`${__dirname}/favicon.ico`);
  } else {
    let filePath = '';
    if (cache[req.url]) {
      filePath = cache[req.url];
      console.log(`Mocking from cached paths ${filePath}`);
    } else {
      let regExp;
      for (const rule in RULES) { // eslint-disable-line no-restricted-syntax
        if (RULES.hasOwnProperty(rule)) { // eslint-disable-line
          regExp = new RegExp(rule);
          if (regExp.test(req.url)) {
            if (path.isAbsolute(RULES[rule])) {
              filePath = path.resolve(MOCKS_PATH, RULES[rule]);
            } else {
              filePath = RULES[rule];
            }
            cache[req.url] = filePath;
            console.log(`Mocking file ${filePath}`);
            break;
          }
        }
      }
    }

    if (filePath) {
      res.sendFile(filePath);
    } else {
      // const redirectUrl = url.resolve(API_URL.href, req.url);
      const redirectUrl = API_URL.href + req.url;
      console.log(`Redirecting to ${redirectUrl}`);

      const apiOpts = {
        hostname: API_URL.hostname,
        path: req.url,
        method: req.method,
        headers: {
          Referer: API_URL.href,
          Origin: API_URL.origin,
        },
      };
      if (req.method === 'POST') {
        apiOpts.headers['Content-Type'] = 'application/x-www-form-urlencoded';
      }
      const protocolModule = API_URL.protocol === 'https:' ? https : http;
      const apiReq = protocolModule.request(apiOpts, (apiRes) => {
        res.set({
          'Content-Type': 'application/json',
        });
        apiRes.pipe(res);
      });

      apiReq.on('error', (error) => {
        res.send(error.message);
      });

      if (req.method === 'POST') {
        let postData = '';
        for (const param in req.body) { // eslint-disable-line no-restricted-syntax
          if (!postData) {
            postData += `${param}=${req.body[param]}`;
          } else {
            postData += `&${param}=${req.body[param]}`;
          }
        }
        console.log('Post data', postData);
        apiReq.write(postData);
      }
      apiReq.end();
    }
  }
}
