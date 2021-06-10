import { doesNotMatch } from 'assert/strict';
import { FastifyReply, FastifyRequest, FastifyInstance } from 'fastify';
import { Controller, GET, POST, getInstanceByToken, FastifyInstanceToken } from 'fastify-decorators';
import PingService from '../services/ping.service';
import { fileSchema, uploadSchema } from './file.schema';
import { uploadFile } from '../services/file.service'

interface FileStructor {
  Body: {
    path: string | undefined
    fileType: string | undefined
  }
  file: any
}

@Controller({ route: '/api/v1/media/' })
export default class FileController {

  private pingService = getInstanceByToken<PingService>(PingService);
  public static instance: FastifyInstance = getInstanceByToken(FastifyInstanceToken);

  @GET({
    url: '/upload',
    options: {
      schema: fileSchema
    }
  })
  async getHandler(req: FastifyRequest, reply: FastifyReply): Promise<object> {
    return { message: this.pingService?.ping() }
  }

  @POST({
    url: '/upload',
    options: {
      // schema: uploadSchema
      schema: {
        body: {
          type: 'object',
          // properties: {
          //   path: { type: 'string' },  // bucket s3 path
          //   fileType: { type: 'string' }, // truck , documents
          //   file: { isFileType: true }
          // },
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
    }
  })
  async postHandler(req: FastifyRequest, reply: FastifyReply): Promise<object> {
    try {

      // console.log("Request :: ", req)
      console.log("Body :: ", req.body)
      console.log("Raw in request :: ", req.raw)

      const bodyTemp: any = req.body

      // const fileBuff: Buffer = await bodyTemp.file.toBuffer()
      const fileBuff: Buffer = bodyTemp.file._buf
      const fileType: string = bodyTemp.fileType.value

      const uploadResult = await uploadFile(fileBuff, {
        Bucket: "cargolink-documents",
        Key: `${bodyTemp.path.value}${bodyTemp.file.filename}`,
      })

      console.log("Upload Result :: ", uploadResult)
      return { message: 'test success' }

    } catch (error) {

      console.log("Error Throw :: ", error)
      throw error;

    }
  }

}
