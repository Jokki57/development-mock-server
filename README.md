### Preamble

Main appointment of this server is mocking api requests. 
I developed it for my own purposes (because others mock servers don't satisfy me)
and then I decided to make it public.

#### With this server you can

- set mocks for requests that satisfy regexp pattern
- serve local files
- broadcast messages to connected clients via socket
- make `POST` or `GET` request with custom `Origin` & `Referer` headers
- server on `http` or `https`
- set options as CLI parameters or in config file

### Usage

##### Mocking
For mocking you **must** define some `config.json` file and pass it as CLI parameter `--config=...`
(of course you can name it as you wish),

**CLI command `development-mock-server --config=./mocks/config.json`**

```
// config.json file or mock-server-config.json
{
    "rules": {
        "\/stream?.+id=8000": "./streamMock.xml",
        "[asd]{2}\/get.{1,3}": "/Users/user/my-project/mocks/mock.json"
    }
}
```

Pay attention that property name is RegExp, so no matter what you'll enter there,
all will be converted in regular expression.
In property value you enter path to mock, it can be relative or absolute.
If `development-mock-server` runs as module from node_modules relative path
will relates to root directory of you project. If you clone it and run something
like `node development-mock-server/src/index.js` relative path will relates
to `development-mock-server` root, and yes, this is evidently.

But you can redefine root directory for relative paths! Just add to your
_config_ `mocks` property.
```
// config.json
{
    "mocks": "./mocks-dir", // relative path, the same rules as i wrote above
    // so if you use this module as dependecy just remember that the ROOT 
    // will be project ROOT
    
    // or absolute
    "mocks": /Users/user/my-project/mocks-dir"
    
    "rules": {
        "\/stream?.+id=8000": "./streamMock.json",
        "[asd]{2}\/get.{1,3}": "/Users/user/my-project/mocks/mock.xml"
    }
}
```

##### API url
This is main url request that this server proxy

```
{
  "api": "https://api.somedomain.com/"
  "rules": {
    "[asd]{2}\/get.{1,3}": "/Users/user/my-project/mocks/mock.xml"
  }
}
```

So if you make request `http://localhost:1234/get/info?p=1`
server will make request `https://api.somedomain.com/get/info?p=1` and get
you response. Also it rewrite `Origin` and `Referer` headers, about this below.
For example if request will be `http://localhost:1234/as/get332` it will
satisfy the rule `[asd]{2}\/get.{1,3}` and server response will be `/Users/user/my-project/mocks/mock.xml`
(as you can see in config)


### Serving files 

You can get direct access to your mocks, just make request to `http://localhost:1234/direct-mock/mock.json`
As you can see, you need add route path 
#### **`/direct-mock/<relative_path_to_mock>`** 
in url. All after this
route path will be relative path to you file. Here you cannot pass absolute paths,
but in future maybe I'll implement absolute path support

### Message broadcasting

To broadcast message you need to make request `http://localhost:1234/broadcast/this-is-message`
So, as you can see, the same logic as above. You need to add special route path

#### **`/broadcast/<message>`**
and after that any text message that some client will get. Example of client
for this broadcasting I'll show below

### Other settings
All this settings you can put in _config file_ or as CLI parameters

```
{
  // this is all available settings
   
  "api": "https://embed.megogo.net/aprx",
  "port": 9999,
  "socketPort": 9998,
  "https": true
  "mocks": "../mocks",
  "origin": "https://google.com",
  "referer": "https://google.com/search",
  "rules": {
    ".+qwe": "./mock.json",
    "123.123": "/Users/user/Projects/JavaScript/development-mock-server/mock.xml",
    ...
  }
}
```
or

`developmnet-mock-server --config=./config.json --port=1234 --socketport=5432 --referer=google.com` and so on
 
 **YOU MUST DEFINE RULES IN CONFIG FILE, YOU CANNOT DO THIS IN CLI**
 
 ### Settings Reference
 
 - `--api` or `"api":` – api url that this server will proxy. Default `https://localhost`
 - `--port` or `"port":` – port for main server. Default `1234`
 - `--socketport` or `"socketPort":` – port of socket server for receiving messages via `/broadcast/<message>`. Default `1235`
 - `--https` or `"https":` – use https or http, pass `true|false`. Default `false`. Note that for https it uses not signed certificate
 - `--mocks` or `"mocks":` – path for mocks, Default: empty line
 - `--origin` or `"origin":` – Value for `Origin` header. Default: `"api":` value
 - `--Referer` or `"Referer":` – Value for `Referer` header. Default: `"api":` value
 - `"rules"` – ONLY IN CONFIG FILE. Value must be object. Name of property this is RegExp pattern, property value – path to mock
 
 ### Example of socket client for broadcasting
 ```
 const net = require('net'); 
 const client = new net.Socket();
 client.connect(1235); // !!! `--socketport` or `"socketPort":`
 client.on('data', (data) => {
    // data is Uint8Array you should convert it to string
    const strData = Buffer.from(data).toString(); 
 });

 ```
 
