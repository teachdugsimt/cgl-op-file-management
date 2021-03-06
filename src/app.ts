import fastify, { FastifyRequest, FastifyReply, RequestPayload } from 'fastify'
import fastifyBlipp from "fastify-blipp";
import { bootstrap } from 'fastify-decorators';

import { resolve } from 'path';
import configApp from './config/app'
import configSwagger from './config/swagger'
import path from 'path';
import { FastifyStaticOptions } from 'fastify-static'
import staticy from 'fastify-static'

function build(opts: object = configApp) {
  const app = fastify(opts)
  app.register(fastifyBlipp)
  app.register(require('fastify-swagger'), configSwagger)
  app.register(staticy, {
    root: path.join(__dirname, '..', 'common', 'static'),
    // prefix: '/assets/'
  } as FastifyStaticOptions);

  app.register(require('fastify-cors'), {
    origin: (origin, cb) => {
      // if(/localhost/.test(origin)){
      //   //  Request from localhost will pass
      //   cb(null, true)
      //   return
      // }
      // Generate an error on other origins, disabling access
      // cb(new Error("Not allowed"))
      cb(null, true)
      return
    }
  })
  app.register(require('fastify-multipart'), {
    attachFieldsToBody: true,
    sharedSchemaId: '#mySharedSchema',
  })

  app.register(bootstrap, {
    directory: resolve(__dirname, `controllers`),
    mask: /\.controller\./,
  });

  return app
}

export default build
