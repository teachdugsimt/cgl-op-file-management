import { FastifyReply, FastifyRequest, FastifyInstance } from 'fastify';
import { Controller, GET, POST, DELETE, getInstanceByToken, FastifyInstanceToken } from 'fastify-decorators';
import PingService from '../services/ping.service';
import {
  fileSchema, uploadSchema, confirmSchema, fileByAttachCode, fileByName, deleteFileSchema,
  fileStreamSchema
} from './file.schema';
import {
  uploadFile, getFileFromS3, getFileFromS3V2, generateImageFromAttachCode,
  attachUrl
} from '../services/file.service'
import { processAttachCode } from '../services/generate-attach-code.service'
import AttachCodeRepository from '../repositories/attach-code.dynamodb.repository'
import { moveFileToS3 } from '../services/move-file-s3.service'

interface FileObject {
  attach_code: string
  file_name: string
  type?: string
  status?: string
  expire?: number | string
  url?: string
}

@Controller({ route: '/api/v1/media' })
export default class FileController {

  private pingService = getInstanceByToken<PingService>(PingService);
  public static instance: FastifyInstance = getInstanceByToken(FastifyInstanceToken);

  @GET({
    url: '/file',
    options: {
      schema: fileSchema
    }
  })
  async getHandler(req: FastifyRequest<{ Querystring: { url: string, file_name?: string } }>, reply: FastifyReply): Promise<object> {
    try {
      console.log("Param : ", req.query)
      const repo = new AttachCodeRepository()
      if (req.query.url) {
        const result = await repo.findByAttachCode(req.query.url)
        const uriS3: string = `${process.env.S3_URL || "https://cargolink-documents.s3.ap-southeast-1.amazonaws.com"}` +
          `/${result.type}/${result.status}/${result.file_name}`
        console.log("Result attcode:: ", result)
        return { uri: uriS3 }
      } else {
        const arr: any = []
        arr.push(req.query.file_name)
        const result = await repo.QueryByFileName(arr)
        const uriS3 = attachUrl(result)
        console.log("Result fileName :: ", uriS3)
        return { uri: uriS3[0]?.url || '' }
      }

    } catch (error: any) {
      console.log("Error Throw :: ", error)
      throw error
    }
  }

  @GET({
    url: '/file-stream',
    options: {
      schema: fileStreamSchema
    }
  })
  async getFileStreamHandler(req: FastifyRequest<{ Querystring: { attachCode: string } }>, reply: FastifyReply): Promise<any> {
    try {
      console.log("Param : ", req.query)

      const objectFile: any = await generateImageFromAttachCode(req.query.attachCode)
      const result = await getFileFromS3(objectFile)
      
      console.log("Result file 1 :: ", result)
      const type_file: string = objectFile?.file_name && objectFile.file_name.toLowerCase().includes('.pdf') ?
        'application/pdf' : 'image/png'
        reply.headers({
          "Content-Type": result.data.ContentType, // binary/octet-stream, image/png, application/octet-stream
          "Content-Length": result.data.ContentLength, // 461751
        }).type(type_file).send(result.bodyContents)

    } catch (error: any) {
      console.log("Error Throw :: ", error)
      throw error
    }
  }
  @GET({
    url: '/file-stream-two',
    options: {
      schema: fileStreamSchema
    }
  })
  async getFileStream2Handler(req: FastifyRequest<{ Querystring: { attachCode: string } }>, reply: FastifyReply): Promise<any> {
    try {
      // PART 6
      const objectFile: any = await generateImageFromAttachCode(req.query.attachCode)
      const result = await getFileFromS3V2(objectFile)

      console.log("Result file 2 :: ", result)
      const type_file: string = objectFile?.file_name && objectFile.file_name.toLowerCase().includes('.pdf') ?
      'application/pdf' : 'image/png'
      reply.headers({
        "Content-Type": result.data.ContentType, // binary/octet-stream, image/png, application/octet-stream
        "Content-Length": result.data.ContentLength, // 461751
      }).type(type_file).send(result.bodyContents)

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
      const attUrl = attachUrl(fileObject)
      return { data: attUrl || [] }
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
      const fileExtendsion: string = bodyTemp.file?.filename ?
        "." + bodyTemp.file?.filename.split(".")[bodyTemp.file?.filename.split(".").length - 1] : ""

      const frontPath: string = path.split("/").slice(0, path.split("/").length - 2).join("/")
      const statusPath: string = path.split("/").slice(path.split("/").length - 2).join("")
      const today = new Date()
      const parseFileName = `${frontPath.replace("/", "-")}-${today.getTime()}${fileExtendsion}`

      const uploadResult = await uploadFile(fileBuff, {
        Bucket: process.env.BUCKET_DOCUMENT || "cargolink-documents",
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

      let parseFileObject = fileObject.filter(e => e.status && e.status == "INPROGRESS")
      if (fileObject && Array.isArray(fileObject) && fileObject.length > 0 && parseFileObject && parseFileObject.length > 0) {

        const loopResult = await Promise.all(parseFileObject.map(async e => {
          const srcPath: string = `${e.type}/INPROGRESS/${e.file_name}`
          const srcBucket: string = process.env.BUCKET_DOCUMENT || "cargolink-documents"
          const destPath: string = `${e.type}/ACTIVE/`
          const destBucket: string = process.env.BUCKET_DOCUMENT || "cargolink-documents"
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




      } else return { message: "Don't have these INPROGRESS attach_code in database" }

    } catch (error) {
      console.log("Error Throw :: ", error)
      throw error
    }
  }

}
 // USER_AVATAR | USER_DOC | VEHICLE_DOC | VEHICLE_IMAGE/{FRONT,BACK,LEFT,RIGHT}
