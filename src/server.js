const express = require('express');
const fs = require('fs');
const path = require('path');
const bodyParser = require('body-parser');
const http = require('http');
const https = require('https');
const SocketServer = require('./socketServer');
const { URL } = require('url');
const { ARGS, DIRECT_MOCK, BROADCAST, DOUBLE_SLASHES_REG } = require('./consts');


class Server {
  constructor(_dirname, argv) {
    this.log = this.log.bind(this);
    this.initStuff = this.initStuff.bind(this);
    this.processRequest = this.processRequest.bind(this);

    const args = require('./processArgs')(argv); // eslint-disable-line

    this.originalDirname = _dirname;
    if (_dirname.indexOf('node_modules') !== -1) {
      this.dirname = path.resolve(__dirname, '../../../'); // move to root folder of project where this module will placed in node_modules
    } else {
      this.dirname = _dirname;
    }

    let configPath = args[ARGS.CONFIG] || args.defs[ARGS.CONFIG];
    if (!path.isAbsolute(configPath)) {
      configPath = path.resolve(this.dirname, configPath);
    }
    const config = require(configPath); // eslint-disable-line

    this.socketPort = args[ARGS.SOCKET_PORT] || config.socketPort || args.defs[ARGS.SOCKET_PORT];
    this.port = args[ARGS.PORT] || config.port || args.defs[ARGS.PORT];

    this.mockPath = args[ARGS.MOCKS] || config.mocks || args.defs[ARGS.MOCKS];
    if (!path.isAbsolute(this.mockPath)) {
      this.mockPath = path.resolve(this.dirname, this.mockPath);
    }

    this.apiUrl = new URL(args[ARGS.API] || config.api || args.defs[ARGS.API]);
    this.rules = config.rules || {};
    this.referer = args[ARGS.REFERER] || config.referer || this.apiUrl.href;
    this.origin = args[ARGS.ORIGIN] || config.origin || this.apiUrl.href;
    this.isHttps = args[ARGS.HTTPS] || config.https || args.defs[ARGS.HTTPS];
    this.isLog = args[ARGS.LOG] || config.log || args.defs[ARGS.LOG];

    if (typeof this.isLog === 'string') {
      this.isLog = this.isLog === 'true';
    }
    if (typeof this.isHttps === 'string') {
      this.isHttps = this.isHttps === 'true';
    }

    this.log('-----------------development-mock-server----------------');
    this.log('API URL:', this.apiUrl.href);
    this.log('MOCKS PATH:', this.mockPath);
    this.log('ORIGIN:', this.origin);
    this.log('REFERER:', this.referer);
    this.log('PROTOCOL:', this.isHttps ? 'https' : 'http');
    this.log('--------------------------------------------------------');
  }

  initStuff() {
    this.app = express();
    this.socketServer = new SocketServer(this.socketPort, this.log);
    this.cache = {};

    if (this.isHttps) {
      const httpsOptions = {
        key: fs.readFileSync(path.resolve(this.originalDirname, './cert/key.pem')),
        cert: fs.readFileSync(path.resolve(this.originalDirname, './cert/cert.pem')),
      };
      https.createServer(httpsOptions, this.app)
        .listen(this.port, () => this.log(`DEVELOPMENT-DEV-SERVER listening on port ${this.port}`));
    } else {
      http.createServer(this.app)
        .listen(this.port, () => this.log(`DEVELOPMENT-DEV-SERVER listening on port ${this.port}`));
    }

    this.app.use(bodyParser.json());
    this.app.use(bodyParser.urlencoded({
      extended: true,
    }));

    this.app.get('/*', this.processRequest);
    this.app.post('/*', this.processRequest);
  }

  processRequest(req, res) {
    res.set({
      'Access-Control-Allow-Origin': req.get('origin'),
      'Access-Control-Allow-Credentials': true,
    });
    if (req.url.indexOf(DIRECT_MOCK) !== -1) {
      const filePath = path.resolve(this.mockPath, req.url.replace(DIRECT_MOCK, ''));
      this.log('Sending direct mock', filePath);
      res.sendFile(filePath);
    } else if (req.url.indexOf(BROADCAST) !== -1) {
      const event = req.url.replace(BROADCAST, '');
      this.log('Broadcasting event', event);
      this.socketServer.broadcastEvent(event);
      res.status(204).end();
    } else if (req.url === '/favicon.ico') {
      res.sendFile(`${this.originalDirname}/favicon.ico`);
    } else {
      let filePath = '';
      if (this.cache[req.url]) {
        filePath = this.cache[req.url];
        this.log(`Mocking from cached paths ${filePath}`);
      } else {
        let regExp;
        for (const rule in this.rules) { // eslint-disable-line no-restricted-syntax
          if (rules.hasOwnProperty(rule)) { // eslint-disable-line
            regExp = new RegExp(rule);
            if (regExp.test(req.url)) {
              if (!path.isAbsolute(this.rules[rule])) {
                filePath = path.resolve(this.mockPath, this.rules[rule]);
              } else {
                filePath = this.rules[rule];
              }
              this.cache[req.url] = filePath;
              this.log(`Mocking file ${filePath}`);
              break;
            }
          }
        }
      }

      if (filePath) {
        res.sendFile(filePath);
      } else {
        const redirectUrl = (this.apiUrl.href + req.url).replace(DOUBLE_SLASHES_REG, '$1');
        this.log(`Redirecting to ${redirectUrl}`);

        const apiOpts = {
          hostname: this.apiUrl.hostname,
          path: req.url,
          method: req.method,
          headers: {
            Referer: this.referer,
            Origin: this.origin,
          },
        };
        if (req.method === 'POST') {
          apiOpts.headers['Content-Type'] = 'application/x-www-form-urlencoded';
        }
        const protocolModule = this.apiUrl.protocol === 'https:' ? https : http;
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
          this.log('Post data', postData);
          apiReq.write(postData);
        }
        apiReq.end();
      }
    }
  }

  log(...logArgs) {
    if (this.isLog) {
      console.log.apply(undefined, logArgs);
    }
  }
}

module.exports = Server;
