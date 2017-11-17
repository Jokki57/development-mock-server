const net = require('net');

let makeLog;

class SocketServer {
  constructor(port, log = console.log) {
    makeLog = log;
    this.port = port;
    this.sockets = [];
    this.server = null;
    this.init();
  }

  init() {
    this.server = net.createServer();
    this.server.listen(this.port);
    makeLog(`SOCKET server listening on port ${this.server.address().port}`);

    this.server.on('connection', (socket) => {
      makeLog(`CONNECTED: ${socket.remoteAddress}:${socket.remotePort}`);

      socket.on('close', () => {
        makeLog(`CLOSED: ${socket.remoteAddress}:${socket.remotePort}`);
        const index = this.sockets.indexOf(socket);
        if (index !== -1) {
          this.sockets.splice(index, 1);
        }
      });

      this.sockets.push(socket);
    });
  }

  broadcastEvent(event) {
    for (let i = 0, l = this.sockets.length; i < l; ++i) {
      this.sockets[i].write(event);
    }
  }
}

module.exports = SocketServer;
