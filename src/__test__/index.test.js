const processArgs = require('../processArgs');

describe('processArgs', () => {
  test('new args', () => {
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
});
