import { FastifySchema, fastify } from "fastify";

const errorObject = {
  type: 'object',
  properties: {
    message: { type: 'string' }
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
    properties: {
      url: { type: 'string' },
      type: { type: 'string' },
    },
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


