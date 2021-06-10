import { FastifySchema, fastify } from "fastify";

export const fileSchema: FastifySchema = {
  response: {
    200: {
      type: 'object',
      properties: {
        message: { type: 'string' },
      },
      additionalProperties: false
    }
  }
}

export const uploadSchema: FastifySchema = {
  body: {
    type: 'object',
    properties: {
      path: { type: 'string' },  // bucket s3 path
      fileType: { type: 'string' }, // truck , documents
      // file: {
      //   type: 'string',
      //   format: 'binary'
      // }
      file: { type: 'array' },
    },
  },
  response: {
    200: {
      type: 'object',
      properties: {
        message: { type: 'string' },
      },
      additionalProperties: false
    }
  }
}


