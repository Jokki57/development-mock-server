const net = jest.genMockFromModule('net');
net.__connectionCallback = Function.prototype;
net.__socketCloseCallback = Function.prototype;

let closeCallback = Function.prototype;
let connectionCallback = Function.prototype;

let testCloseCallback = Function.prototype;
let testConnectionCallback = Function.prototype;
let testWriteCallback = Function.prototype;

class Server {
  listen(port) {
    this.port = port;
  }

  on(event, cb) {
    const socket = new Socket();
    connectionCallback = () => {
      cb(socket);
      testConnectionCallback(socket);
    };
  }

  address() {
    return { port: this.port };
  }
}

class Socket {
  constructor() {
    this.remoteAddress = 'https://localhost';
    this.remotePort = '1234';
  }

  on(event, cb) {
    closeCallback = () => {
      cb();
      testCloseCallback();
    }
  }

  write(event) {
    testWriteCallback(event);
  }
}

net.createServer = () => new Server();
net.__setSocketCloseCallback = (cb) => {
  testCloseCallback = cb;
};
net.__setConnectionCallback = (cb) => {
  testConnectionCallback = cb;
};

net.__setWriteCallback = (cb) => {
  testWriteCallback  = cb
};

net.__triggerSocketClose = () => {
  closeCallback();
};

net.__triggerConnection = () => {
  connectionCallback();
};

module.exports = net;
