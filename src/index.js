#! /usr/bin/env node

const express = require('express');
const fs = require('fs');
const path = require('path');
const bodyParser = require('body-parser');
const http = require('http');
const https = require('https');
const SocketServer = require('./socketServer');
const { URL } = require('url');
const { ARGS } = require('./consts');

// Path constants
const DIRECT_MOCK = '/direct-mock/';
const BROADCAST = '/broadcast/';
const DOUBLE_SLASHES_REG = /([^:]\/)\/+/g;

let dirname = __dirname;
if (__dirname.indexOf('node_modules') !== -1) {
  dirname = path.resolve(__dirname, '../../../'); // move to root folder of project where this module will placed in node_modules
}

// process args
const args = require('./processArgs')(process.argv);

let configPath = args[ARGS.CONFIG] || args.defs[ARGS.CONFIG];
if (!path.isAbsolute(configPath)) {
  configPath = path.resolve(dirname, configPath);
}

const config = require(configPath); // eslint-disable-line
const SOCKET_PORT = args[ARGS.SOCKET_PORT] || config.socketPort || args.defs[ARGS.SOCKET_PORT];
const PORT = args[ARGS.PORT] || config.port || args.defs[ARGS.PORT];

let mockPath = args[ARGS.MOCKS] || config.mocks || args.defs[ARGS.MOCKS];
if (!path.isAbsolute(mockPath)) {
  mockPath = path.resolve(dirname, mockPath);
}

const apiUrl = new URL(args[ARGS.API] || config.api || args.defs[ARGS.API]);
const rules = config.rules || {};
const referer = args[ARGS.REFERER] || config.referer || apiUrl.href;
const origin = args[ARGS.ORIGIN] || config.origin || apiUrl.href;
let isHttps = args[ARGS.HTTPS] || config.https || args.defs[ARGS.HTTPS];
let log = args[ARGS.LOG] || config.log || args.defs[ARGS.LOG];

if (typeof log === 'string') {
  log = log === 'true';
}
if (typeof isHttps === 'string') {
  isHttps = isHttps === 'true';
}

makeLog('-----------------development-mock-server----------------');
makeLog('API URL:', apiUrl.href);
makeLog('MOCKS PATH:', mockPath);
makeLog('ORIGIN:', origin);
makeLog('REFERER:', referer);
makeLog('PROTOCOL:', isHttps ? 'https' : 'http');
makeLog('--------------------------------------------------------');

// init stuff
const app = express();
const socketServer = new SocketServer(SOCKET_PORT, makeLog);
const cache = {};

if (isHttps) {
  const httpsOptions = {
    key: fs.readFileSync(path.resolve(__dirname, './cert/key.pem')),
    cert: fs.readFileSync(path.resolve(__dirname, './cert/cert.pem')),
  };
  https.createServer(httpsOptions, app)
    .listen(PORT, () => makeLog(`DEVELOPMENT-DEV-SERVER listening on port ${PORT}`));
} else {
  http.createServer(app)
    .listen(PORT, () => makeLog(`DEVELOPMENT-DEV-SERVER listening on port ${PORT}`));
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
    const filePath = path.resolve(mockPath, req.url.replace(DIRECT_MOCK, ''));
    makeLog('Sending direct mock', filePath);
    res.sendFile(filePath);
  } else if (req.url.indexOf(BROADCAST) !== -1) {
    const event = req.url.replace(BROADCAST, '');
    makeLog('Broadcasting event', event);
    socketServer.broadcastEvent(event);
    res.status(204).end();
  } else if (req.url === '/favicon.ico') {
    res.sendFile(`${__dirname}/favicon.ico`);
  } else {
    let filePath = '';
    if (cache[req.url]) {
      filePath = cache[req.url];
      makeLog(`Mocking from cached paths ${filePath}`);
    } else {
      let regExp;
      for (const rule in rules) { // eslint-disable-line no-restricted-syntax
        if (rules.hasOwnProperty(rule)) { // eslint-disable-line
          regExp = new RegExp(rule);
          if (regExp.test(req.url)) {
            if (!path.isAbsolute(rules[rule])) {
              filePath = path.resolve(mockPath, rules[rule]);
            } else {
              filePath = rules[rule];
            }
            cache[req.url] = filePath;
            makeLog(`Mocking file ${filePath}`);
            break;
          }
        }
      }
    }

    if (filePath) {
      res.sendFile(filePath);
    } else {
      const redirectUrl = (apiUrl.href + req.url).replace(DOUBLE_SLASHES_REG, '$1');
      makeLog(`Redirecting to ${redirectUrl}`);

      const apiOpts = {
        hostname: apiUrl.hostname,
        path: req.url,
        method: req.method,
        headers: {
          Referer: referer,
          Origin: origin,
        },
      };
      if (req.method === 'POST') {
        apiOpts.headers['Content-Type'] = 'application/x-www-form-urlencoded';
      }
      const protocolModule = apiUrl.protocol === 'https:' ? https : http;
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
        makeLog('Post data', postData);
        apiReq.write(postData);
      }
      apiReq.end();
    }
  }
}

function makeLog(...logArgs) {
  if (log) {
    console.log.apply(undefined, logArgs);
  }
}
