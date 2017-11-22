const Server = require('../server');

const mockConfig = {
  'api': 'https://embed.megogo.net/aprx',
  'port': 9999,
  'socketPort': 9998,
  'mocks': '../mocks',
  'https': false,
  'log': false,
  'origin': 'https://localhost',
  'referer': 'https://localhost/test',
  'rules': {
    '.+qwe': './config.json',
    '123.123': '/Users/jurijzakharchuk/Projects/JavaScript/development-mock-server/package.json'
  }
};

const mockSimpleConfig = {
  'rules': {
    'asd': 'asd',
    'qwe': 'qwe',
  }
};

jest.mock('express');
jest.mock('/user/dev-server-config.json', () => mockConfig, { virtual: true });
jest.mock('/user/test/config.json', () => mockSimpleConfig, { virtual: true });



describe('server', () => {
  let server;
  const dirname = '/user/test/node_modules/server/src';

  describe('params from config file', () => {
    let server;
    beforeAll(() => {
      server = new Server(dirname, []);
    });

    test('dirnames', () => {
      expect(server.originalDirname).toBe(dirname);
      expect(server.dirname).toBe('/user/test');
    });

    test('config', () => {
      expect(server.config).toEqual(mockConfig);
    });

    test('rules', () => {
      expect(server.rules).toEqual(mockConfig.rules);
    });

    test('ports', () => {
      expect(server.socketPort).toBe(mockConfig.socketPort);
      expect(server.port).toBe(mockConfig.port);
    });

    test('ports', () => {
      expect(server.socketPort).toBe(mockConfig.socketPort);
      expect(server.port).toBe(mockConfig.port);
    });

    test('mock path', () => {
      expect(server.mockPath).toBe('/user/mocks');
    });

    test('apiUrl', () => {
      expect(server.apiUrl.href).toBe(mockConfig.api);
    });

    test('origin', () => {
      expect(server.origin).toBe(mockConfig.origin);
    });

    test('referer', () => {
      expect(server.referer).toBe(mockConfig.referer);
    });

    test('isHttps', () => {
      expect(server.isHttps).toBe(mockConfig.https);
    });

    test('isLog', () => {
      expect(server.isLog).toBe(mockConfig.log);
    });
  });

  describe('params from argv', () => {
    beforeAll(() => {
      const args = [
        `--api=${mockConfig.api}`,
        `--port=${mockConfig.port}`,
        `--socketport=${mockConfig.socketPort}`,
        `--mocks=${mockConfig.mocks}`,
        `--https=${mockConfig.https}`,
        `--log=${mockConfig.log}`,
        `--origin=${mockConfig.origin}`,
        `--referer=${mockConfig.referer}`,
        `--https=${mockConfig.https}`,
        '--config=./config.json',
      ];
      server = new Server(dirname, args);
    });

    test('dirnames', () => {
      expect(server.originalDirname).toBe(dirname);
      expect(server.dirname).toBe('/user/test');
    });

    test('config', () => {
      expect(server.config).toEqual(mockSimpleConfig);
    });

    test('ports', () => {
      expect(server.socketPort).toBe(mockConfig.socketPort);
      expect(server.port).toBe(mockConfig.port);
    });

    test('ports', () => {
      expect(server.socketPort).toBe(mockConfig.socketPort);
      expect(server.port).toBe(mockConfig.port);
    });

    test('mock path', () => {
      expect(server.mockPath).toBe('/user/mocks');
    });

    test('apiUrl', () => {
      expect(server.apiUrl.href).toBe(mockConfig.api);
    });

    test('origin', () => {
      expect(server.origin).toBe(mockConfig.origin);
    });

    test('referer', () => {
      expect(server.referer).toBe(mockConfig.referer);
    });

    test('isHttps', () => {
      expect(server.isHttps).toBe(mockConfig.https);
    });

    test('isLog', () => {
      expect(server.isLog).toBe(mockConfig.log);
    });
  });

});