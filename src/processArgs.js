const { ARGS } = require('./consts');

const _ = require('lodash');

module.exports = (argv) => {
  const result = {
    defs: {
      [ARGS.API]: 'https://localhost',
      [ARGS.MOCKS]: './mocks',
      [ARGS.PORT]: '1234',
      [ARGS.SOCKET_PORT]: '1235',
      [ARGS.CONFIG]: '../dev-server-config.json',
      [ARGS.HTTPS]: false,
    },
  };
  if (_.isArray(argv)) {
    let keyValue;
    for (let i = 2, l = argv.length; i < l; ++i) {
      keyValue = argv[i].split('=');
      result[keyValue[0]] = keyValue[1];
    }
  }
  return result;
};
