const { ARGS } = require('./consts');

module.exports = (argv) => {
  const result = {
    defs: {
      [ARGS.API]: 'https://localhost',
      [ARGS.MOCKS]: '',
      [ARGS.PORT]: '1234',
      [ARGS.SOCKET_PORT]: '1235',
      [ARGS.CONFIG]: '../dev-server-config.json',
      [ARGS.HTTPS]: false,
      [ARGS.LOG]: true,
    },
  };
  if (Array.isArray(argv)) {
    let keyValue;
    for (let i = 2, l = argv.length; i < l; ++i) {
      keyValue = argv[i].split('=');
      result[keyValue[0]] = keyValue[1];
    }
  }
  return result;
};
