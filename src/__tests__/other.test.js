const processArgs = require('../processArgs');
const SocketServer = require('../socketServer');

jest.mock('net');

test('processArgs', () => {
  const args = processArgs([
    'porcess path',
    'process name',
    '--api=test',
    '--mocks=/test/test',
    '--port=1234',
    '--socketport=1235',
    '--config=/test/test',
    '--https=true',
    '--log=false',
    '--origin=https://test.com',
    '--referer=https://test.com',
  ]);
  expect(args).toEqual({
    '--api': 'test',
    '--mocks': '/test/test',
    '--port': '1234',
    '--socketport': '1235',
    '--config': '/test/test',
    '--https': 'true',
    '--log': 'false',
    '--origin': 'https://test.com',
    '--referer': 'https://test.com',
    defs: {
      '--api': 'https://localhost',
      '--mocks': '',
      '--port': '1234',
      '--socketport': '1235',
      '--config': '../dev-server-config.json',
      '--https': false,
      '--log': true,
    },
  });
});

describe.only('socketServer', () => {
  let socketServer;
  const net = require('net');

  test('init', () => {
    net.__setConnectionCallback((socket) => {
      expect(socketServer).toHaveProperty('sockets', [socket]);
    });
    socketServer = new SocketServer(9999, Function.prototype);
    net.__triggerConnection();
  });

  test('broadcast', () => {
    const message = 'trololo';
    net.__setWriteCallback((event) => {
      expect(event).toEqual(message);
    });
    socketServer.broadcastEvent(message);
  });

  test('close socket', () => {
    net.__setSocketCloseCallback(() => {
      expect(socketServer.sockets.length).toEqual(0);
    });
    net.__triggerSocketClose();
  });

});
