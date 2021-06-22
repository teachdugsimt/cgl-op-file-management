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
const normalError = {
  type: 'object',
  properties: {
    message: { type: 'string' }
  }
}

export const fileSchema: FastifySchema = {
  querystring: {
    type: 'object',
    properties: {
      userId: { type: 'string' },
      fileType: { type: 'string' },
      status: { type: 'string' },
    }
  },
  response: {
    200: {
      type: 'object',
      properties: {
        data: { type: 'array' },
      },
      additionalProperties: false
    },

    403: normalError,
  }
}

export const uploadSchema: FastifySchema = {
  body: {
    type: 'object',
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


