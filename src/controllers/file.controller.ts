import { doesNotMatch } from 'assert/strict';
import { FastifyReply, FastifyRequest, FastifyInstance } from 'fastify';
import { Controller, GET, POST, DELETE, getInstanceByToken, FastifyInstanceToken } from 'fastify-decorators';
import PingService from '../services/ping.service';
import { fileSchema, uploadSchema, confirmSchema, fileByAttachCode, fileByName, deleteFileSchema } from './file.schema';
import { uploadFile } from '../services/file.service'
import { processAttachCode } from '../services/generate-attach-code.service'
import AttachCodeRepository from '../repositories/attach-code.dynamodb.repository'
import { moveFileToS3 } from '../services/move-file-s3.service'
// import BuildResponse from "utility-layer/dist/build-response";
// const buildResponse = new BuildResponse()

interface FileObject {
  attach_code: string
  file_name: string
  type?: string
  status?: string
  expire?: number | string
}

@Controller({ route: '/api/v1/media/' })
export default class FileController {

  private pingService = getInstanceByToken<PingService>(PingService);
  public static instance: FastifyInstance = getInstanceByToken(FastifyInstanceToken);

  @GET({
    url: '/file',
    options: {
      schema: fileSchema
    }
  })
  async getHandler(req: FastifyRequest<{ Querystring: { attach_code: string } }>, reply: FastifyReply): Promise<object> {
    try {
      console.log("Param : ", req.query)
      const repo = new AttachCodeRepository()
      const result = await repo.findByAttachCode(req.query.attach_code)
      const uriS3: string = `${process.env.S3_URL || "https://cargolink-documents.s3.ap-southeast-1.amazonaws.com"}` +
        `/${result.type}/${result.status}/${result.file_name}`

      console.log("Result :: ", result)
      return { uri: uriS3 }
    } catch (error: any) {
      console.log("Error Throw :: ", error)
      throw error
    }
  }

  @GET({
    url: '/file-by-attach-code',
    options: {
      schema: fileByAttachCode
    }
  })
  async getFileWithAttachCode(req: FastifyRequest<{ Querystring: { url: string } }>, reply: FastifyReply): Promise<any> {
    try {
      let attach_array = typeof req.query.url == "string" ? JSON.parse(req.query.url) : req.query.url
      console.log("Step 1 : file-by-attach-code ", attach_array)
      const repo = new AttachCodeRepository()
      const fileObject: FileObject[] = await repo.queryFromAttachCode(attach_array || ['null'])
      console.log("File by atttach code result ::  ", fileObject)
      return { data: fileObject || [] }
    } catch (error: any) {
      console.log("Error Throw :: ", error)
      throw error
    }
  }
  @GET({
    url: '/file-by-name',
    options: {
      schema: fileByName
    }
  })
  async queryByFileName(req: FastifyRequest<{ Querystring: { list: string } }>, reply: FastifyReply): Promise<any> {
    try {
      let attach_array = typeof req.query.list == "string" ? JSON.parse(req.query.list) : req.query.list
      console.log("Step 1 : file-by-name ", attach_array)
      const repo = new AttachCodeRepository()
      const fileObject: FileObject[] = await repo.QueryByFileName(attach_array || [])
      console.log("File by name result ::  ", fileObject)
      return { data: fileObject }
    } catch (error: any) {
      console.log("Error Throw :: ", error)
      throw error
    }
  }

  @DELETE({
    url: '/delete',
    options: {
      schema: deleteFileSchema
    }
  })
  async deleteByAttachCode(req: FastifyRequest<{ Body: { list: string[] } }>, reply: FastifyReply): Promise<any> {
    try {
      let attach_array = typeof req.body == "string" ? JSON.parse(req.body).list : req.body.list
      console.log("Step 1 : delete by attach ", attach_array)
      const repo = new AttachCodeRepository()
      const fileObject: any = await repo.deleteFromAttachCode(attach_array || [])
      console.log("Delete by attach code result ::  ", fileObject)
      return { data: fileObject ? true : false }
    } catch (error: any) {
      console.log("Error Throw :: ", error)
      throw error
    }
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

      // USER_AVATAR | USER_DOC | VEHICLE_DOC | VEHICLE_IMAGE/{FRONT,BACK,LEFT,RIGHT}
      const path: string = bodyTemp?.path?.value

      // const fileBuff: Buffer = await bodyTemp.file.toBuffer()
      const fileBuff: Buffer = bodyTemp.file._buf


      const frontPath: string = path.split("/").slice(0, path.split("/").length - 2).join("/")
      const statusPath: string = path.split("/").slice(path.split("/").length - 2).join("")
      const today = new Date()
      const parseFileName = `${frontPath.replace("/", "-")}-${today.getTime()}`

      const uploadResult = await uploadFile(fileBuff, {
        Bucket: "cargolink-documents",
        Key: `${path}${parseFileName}`,
      })

      let response: any
      if (uploadResult && Object.keys(uploadResult).length > 0) {
        response = await processAttachCode(parseFileName, frontPath, statusPath)
        console.log("Response ::  ", response)
        return {
          ...response,
          token: response.attachCode,
          fileUrl: uploadResult.Location,
          fileType: bodyTemp.file.mimetype,
          uploadedDate: new Date()
        }
      } else return {
        fileName: null,
        attachCode: null,
        type: null,
        status: null,
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
  async confirmHandler(req: FastifyRequest<{ Body: string | { url: string[] } }>, reply: FastifyReply): Promise<any> {
    try {
      let attach_array = typeof req.body == "string" ? JSON.parse(req.body).url : req.body.url
      console.log("Step 1 :: ", attach_array)
      const repo = new AttachCodeRepository()
      const fileObject: FileObject[] = await repo.queryFromAttachCode(attach_array)
      console.log("File name object :: ", fileObject)

      if (fileObject && Array.isArray(fileObject) && fileObject.length > 0) {

        let parseFileObject = fileObject.filter(e => e.status && e.status == "INPROGRESS")

        const loopResult = await Promise.all(parseFileObject.map(async e => {
          const srcPath: string = `${e.type}/INPROGRESS/${e.file_name}`
          const srcBucket: string = process.env.bucket || "cargolink-documents"
          const destPath: string = `${e.type}/ACTIVE/`
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
          if (result) await repo.updateStatus({ attach_code: e.attach_code }, "ACTIVE", "status")
          return result
        }))
        console.log("loopResult  result :: ", loopResult)

        if (loopResult && loopResult.length > 0) return { message: 'confirm success' }
        else return { message: "move file unsuccess" }




      } else return { message: "Don't have these attach_code in database" }

    } catch (error) {
      console.log("Error Throw :: ", error)
      throw error
    }
  }

}
 // USER_AVATAR | USER_DOC | VEHICLE_DOC | VEHICLE_IMAGE/{FRONT,BACK,LEFT,RIGHT}
