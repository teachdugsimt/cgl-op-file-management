const awsLambdaFastify = require('aws-lambda-fastify');
const app = require('./dist/server');

const proxy = awsLambdaFastify(app);
// or
// const proxy = awsLambdaFastify(app, { binaryMimeTypes: ['application/octet-stream', "application/json"] })

// exports.handler = proxy
exports.handler = (event, context, callback) => {
  console.log('event :>> ', event);
  console.log('context :>> ', context);
  context.callbackWaitsForEmptyEventLoop = false;
  proxy(event, context, callback);
};
// or
// exports.handler = (event, context, callback) => proxy(event, context, callback)
// or
// exports.handler = (event, context) => proxy(event, context)
// or
// exports.handler = async (event, context) => proxy(event, context)
