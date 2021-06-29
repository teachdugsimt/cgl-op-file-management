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
      attach_code: { type: 'string', nullable: true },
      file_name: { type: 'string', nullable: true },
    }
  },
  response: {
    200: {
      type: 'object',
      properties: {
        uri: { type: 'string' }
      }
      // type: 'string'
    },

    403: normalError,
  }
}

export const fileStreamSchema: FastifySchema = {
  querystring: {
    type: 'object',
    properties: {
      attach_code: { type: 'string' },
    }
  },
  response: {
    200: {
      type: 'object',
      isFileType: true
    },
    403: normalError,
  }
}
export const fileStreamSchema2: FastifySchema = {
  querystring: {
    type: 'object',
    properties: {
      attach_code: { type: 'string' },
    }
  },
  response: {
    200: {
      type: 'string'
    },
    403: normalError,
  }
}

export const fileByAttachCode: FastifySchema = {
  querystring: {
    type: 'object',
    properties: {
      url: { type: 'string' }
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

export const fileByName: FastifySchema = {
  querystring: {
    type: 'object',
    properties: {
      list: { type: 'string' }
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

export const deleteFileSchema: FastifySchema = {
  body: {
    type: 'object',
    properties: {
      list: { type: 'array', items: { type: 'string' } }
    }
  },
  response: {
    200: {
      type: 'object',
      properties: {
        data: { type: 'boolean' },
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
        attachCode: { type: 'string' },
        token: { type: 'string' },
        fileName: { type: 'string' },
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


