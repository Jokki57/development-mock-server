const net = require('net');

class SocketServer {
  constructor(port) {
    this.port = port;
    this.sockets = [];
    this.server = null;
    this.init();
  }

  init() {
    this.server = net.createServer();
    this.server.listen(this.port);
    console.log(`SOCKET server listening on port ${this.server.address().port}`);

    this.server.on('connection', (socket) => {
      console.log(`CONNECTED: ${socket.remoteAddress}:${socket.remotePort}`);

      socket.on('close', () => {
        console.log(`CLOSED: ${socket.remoteAddress}:${socket.remotePort}`);
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
