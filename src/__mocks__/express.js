let appCb = Function.prototype;
let responseCb = Function.prototype;

let getCb = Function.prototype;
let postCb = Function.prototype;

const express = () => {
  return new App();
};

class App {
  use() {
  }

  get(path, callback) {
    getCb = callback;
  }

  post(path, callback) {
    postCb = callback;
  }
}

class Response {
  constructor(url, method) {
    this.url = url;
  }

  status(status) {
    this.status = status;
    responseCb('status');
    return this;
  }

  send(sendMessage) {
    this.sendMessage = sendMessage;
    responseCb('send');
  }

  set(headers) {
    this.headers = headers;
    responseCb('set');
  }

  end() {
    this.ended = true;
    responseCb('end');
  }
}


express.__triggerGet = (url) => {
  const req = new Response(url, 'GET');
  const res = new Response(url, 'GET');
  getCb(req, res);
  appCb('get', req, res);
};

express.__triggerPost = (url) => {
  const req = new Response(url, 'POST');
  const res = new Response(url, 'POST');
  postCb(req, res);
  appCb('post', req, res);
};

module.exports = express;
