const processArgs = require('../processArgs');

describe('processArgs', () => {
  test('new args', () => {
    const args = processArgs([
      '--api=test',
      '--mocks=/test/test',
      '--port=1234',
      '--socketPort=1235',
      '--config=/test/test',
      '--https=true',
      '--log=false',
      '--origin=https://test.com',
      '--referer=https://test.com',
    ]);
    expect(args).toContainEqual({
      '--api': 'test',
      '--mocks': '/test/test',
      '--port': '1234',
      '--socketPort': '1235',
      '--config': '/test/test',
      '--https': 'true',
      '--log': 'false',
      '--origin': 'https://test.com',
      '--referer': 'https://test.com',
      defs: {
        '--api': 'https://localhost',
        '--mocks': '',
        '--port': '1234',
        '--socketPort': '1235',
        '--config': '../dev-server-config.json',
        '--https': false,
        '--log': true,
      },
    });
  });
});