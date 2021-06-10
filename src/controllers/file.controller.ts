import { doesNotMatch } from 'assert/strict';
import { FastifyReply, FastifyRequest, FastifyInstance } from 'fastify';
import { Controller, GET, POST, getInstanceByToken, FastifyInstanceToken } from 'fastify-decorators';
import PingService from '../services/ping.service';
import { fileSchema, uploadSchema, confirmSchema } from './file.schema';
import { uploadFile } from '../services/file.service'
import { processAttachCode } from '../services/generate-attach-code.service'
import AttachCodeRepository from '../repositories/attach-code.dynamodb.repository'
import { moveFileToS3 } from '../services/move-file-s3.service'
// import BuildResponse from "utilitylayer/src/helper/BuildResponse";

interface FileObject {
  attach_code: string
  file_name: string
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
    options: { schema: uploadSchema }
  })
  async postHandler(req: FastifyRequest, reply: FastifyReply): Promise<any> {
    try {

      // console.log("Request :: ", req)
      console.log("Body :: ", req.body)
      console.log("Raw in request :: ", req.raw)

      const bodyTemp: any = req.body
      const path: string = bodyTemp?.path?.value || 'truck/inprogress/'

      // const fileBuff: Buffer = await bodyTemp.file.toBuffer()
      const fileBuff: Buffer = bodyTemp.file._buf

      const uploadResult = await uploadFile(fileBuff, {
        Bucket: "cargolink-documents",
        Key: `${path}${bodyTemp.file.filename}`,
      })
      let response: any
      if (uploadResult && Object.keys(uploadResult).length > 0) {
        response = await processAttachCode(bodyTemp.file.filename)

        return {
          ...response,
          token: response.attach_code,
          fileUrl: uploadResult.Location,
          fileType: bodyTemp.file.mimetype,
          uploadedDate: new Date()
        }
      } else return {
        file_name: null,
        attach_code: null,
        token: null,
        fileUrl: null,
        fileType: null,
        uploadedDate: null,
      }

    } catch (error) {
      console.log("Error Throw :: ", error)
      return { message: JSON.stringify(error) }
    }
  }




  @POST({
    url: '/confirm',
    options: { schema: confirmSchema }
  })
  async confirmHandler(req: FastifyRequest<{ Body: { url: string, type: string } }>, reply: FastifyReply): Promise<any> {
    try {
      let token = req.body.url
      const repo = new AttachCodeRepository()
      const filename: FileObject = await repo.findByAttachCode(token)
      console.log("File name object :: ", filename)
      if (filename) {

        const srcPath: string = `${req.body.type}/inprogress/${filename.file_name}`
        const srcBucket: string = process.env.bucket || "cargolink-documents"
        const destPath: string = `${req.body.type}/active/`
        const destBucket: string = process.env.bucket || "cargolink-documents"
        const region: string = process.env.region || 'ap-southeast-1'
        console.log("Object detail :: ", {
          srcPath,
          srcBucket,
          destPath,
          destBucket,
          region
        })
        const result = await moveFileToS3(srcPath, srcBucket, destPath, destBucket, region)

        if (result) return { message: 'confirm success' }
        else return { message: "move file unsuccess" }

      } else return { message: "Don't have this attach_code in database" }

    } catch (error) {
      console.log("Error Throw :: ", error)
      return { message: JSON.stringify(error) }
    }
  }

}
