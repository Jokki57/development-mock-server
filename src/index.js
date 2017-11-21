#! /usr/bin/env node

const Server = require('./server');

const server = new Server(__dirname, process.argv.slice(2));
server.initStuff();

