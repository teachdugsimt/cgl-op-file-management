import { FastifySchema, fastify } from "fastify";

const errorObject = {
  type: 'object',
  properties: {
    isBase64Encoded: { type: 'boolean' },
    statusCode: { type: 'number' },
    headers: { type: 'object', properties: { origin: { type: 'string' } } },
    body: { type: 'string' }
  }
}

export const fileSchema: FastifySchema = {
  response: {
    200: {
      type: 'object',
      properties: {
        message: { type: 'string' },
      },
      additionalProperties: false
    },
    403: errorObject
  }
}

export const uploadSchema: FastifySchema = {
  body: {
    type: 'object',
    // properties: {
    //   path: { type: 'string' },  // bucket s3 path
    //   file: { isFileType: true }
    // },
  },
  response: {
    200: {
      type: 'object',
      properties: {
        attach_code: { type: 'string' },
        token: { type: 'string' },
        file_name: { type: 'string' },
        user_id: { type: 'string' },
        type: { type: 'string' },
        status: { type: 'string' },
        fileUrl: { type: 'string' },
        fileType: { type: 'string' },
        uploadedDate: { type: 'string' },
      },
      additionalProperties: false
    },
    403: {
      type: 'object'
    }
  }
}

export const confirmSchema: FastifySchema = {
  body: {
    type: 'object',
  },
  response: {
    200: {
      type: 'object',
      properties: {
        message: { type: 'string' },
      },
      additionalProperties: false
    },
    403: errorObject,
    500: errorObject
  }
}


