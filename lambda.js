const awsLambdaFastify = require('aws-lambda-fastify');
const app = require('./dist/server');

// const proxy = awsLambdaFastify(app);
// or
const proxy = awsLambdaFastify(app, {
  binaryMimeTypes: ['image/png', 'image/jpg', 'image/jpeg', 'application/octet-stream',
    'multipart/form-data', 'application/pdf']
})

// exports.handler = proxy
exports.handler = (event, context, callback) => {
  console.log('event :>> ', event);
  console.log('context :>> ', context);
  context.callbackWaitsForEmptyEventLoop = false;
  if (event.path && event.path.includes('file-stream-twelve'))
    proxy(event, context, callback);
  else proxy(event, context, callback);
};
// or
// exports.handler = (event, context, callback) => proxy(event, context, callback)
// or
// exports.handler = (event, context) => proxy(event, context)
// or
// exports.handler = async (event, context) => proxy(event, context)
