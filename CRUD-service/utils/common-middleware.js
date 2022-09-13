const middleWare = require("middy");
const {
  jsonBodyParser,
  httpEventNormalizer,
  httpErrorHandler,
} = require("middy/middlewares");

module.exports = (fn) =>
  middleWare(fn)
    .use(jsonBodyParser())
    .use(httpEventNormalizer())
    .use(httpErrorHandler());
