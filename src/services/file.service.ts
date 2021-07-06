import {
  CompleteMultipartUploadCommand,
  CompleteMultipartUploadCommandInput,
  CreateMultipartUploadCommand,
  CreateMultipartUploadCommandInput,
  S3Client,
  UploadPartCommand,
  UploadPartCommandInput,
  GetObjectCommand,
} from '@aws-sdk/client-s3'
import S3 from 'aws-sdk/clients/s3'
import AWS from 'aws-sdk'
import AttachCodeRepository from '../repositories/attach-code.dynamodb.repository'
import { Readable } from 'stream';
import { TextDecoder } from 'util';


const region = process.env.AWS_REGION || 'ap-southeast-1'
const client = new S3Client({ region })
interface FileObject {
  attach_code: string
  file_name: string
  type?: string
  status?: string
  expire?: number | string
  url?: string
}
export const attachUrl = (fileObject: FileObject[]) => {
  if (fileObject.length <= 0) return []
  else {
    const arr = fileObject.map(e => {
      const uriS3: string = `${process.env.S3_URL || "https://cargolink-documents.s3.ap-southeast-1.amazonaws.com"}` +
        `/${e.type}/${e.status}/${e.file_name}`
      return { ...e, url: uriS3 }
    })
    return arr
  }
}

export const uploadFile = async (file: Buffer, createParams: CreateMultipartUploadCommandInput): Promise<any> => {
  try {
    const createUploadResponse = await client.send(
      new CreateMultipartUploadCommand(createParams)
    )
    const { Bucket, Key } = createParams
    const { UploadId } = createUploadResponse
    console.log('Upload initiated. Upload ID: ', UploadId)

    // 5MB is the minimum part size
    // Last part can be any size (no min.)
    // Single part is treated as last part (no min.)
    const partSize = (1024 * 1024) * 5 // 5MB
    const fileSize = file.length
    const numParts = Math.ceil(fileSize / partSize)

    const uploadedParts: any = []
    let remainingBytes = fileSize

    for (let i = 1; i <= numParts; i++) {
      let startOfPart = fileSize - remainingBytes
      let endOfPart = Math.min(partSize, startOfPart + remainingBytes)

      if (i > 1) {
        endOfPart = startOfPart + Math.min(partSize, remainingBytes)
        startOfPart += 1
      }

      const uploadParams: UploadPartCommandInput = {
        // add 1 to endOfPart due to slice end being non-inclusive
        Body: file.slice(startOfPart, endOfPart + 1),
        Bucket,
        Key,
        UploadId,
        PartNumber: i
      }
      const uploadPartResponse = await client.send(new UploadPartCommand(uploadParams))
      console.log(`Part #${i} uploaded. ETag: `, uploadPartResponse.ETag)

      remainingBytes -= Math.min(partSize, remainingBytes)

      uploadedParts.push({ PartNumber: i, ETag: uploadPartResponse.ETag })
    }

    const completeParams: CompleteMultipartUploadCommandInput = {
      Bucket,
      Key,
      UploadId,
      MultipartUpload: {
        Parts: uploadedParts
      }
    }
    console.log('Completing upload...')
    const completeData = await client.send(new CompleteMultipartUploadCommand(completeParams))
    console.log('Upload complete: ', completeData, '\n---')
    return completeData
  } catch (e) {
    console.log("Erro service :: ", e)
    throw e
  }
}


export const getFileFromS3 = async (objectFile: AttachCodeModel) => {
  const command = new GetObjectCommand({
    Bucket: process.env.BUCKET_DOCUMENT || "cargolink-documents",
    Key: `${objectFile.type}/${objectFile.status}/${objectFile.file_name}`,
  });
  const data = await client.send(command);

  return { bodyContents: data.Body, data }
}
// getFileFromS3()  // UFO Language

export const getFileFromS3V2 = async (objectFile: AttachCodeModel) => {
  var params = {
    Bucket: process.env.BUCKET_DOCUMENT || "cargolink-documents",
    Key: `${objectFile.type}/${objectFile.status}/${objectFile.file_name}`,
  };
  const s3 = new AWS.S3()

  const ressult: any = await s3.getObject(params).promise()

  return { bodyContents: ressult.Body, data: ressult }
}
// getFileFromS3V2() // Buffer : ff 32 aa

export const getFileFromS3V3 = async (objectFile: AttachCodeModel) => {
  var params = {
    Bucket: process.env.BUCKET_DOCUMENT || "cargolink-documents",
    Key: `${objectFile.type}/${objectFile.status}/${objectFile.file_name}`,
  };
  const s3 = new AWS.S3()

  return s3.getObject(params).createReadStream()
}

export const getFileFromS3V4 = async (objectFile: AttachCodeModel) => {
  var params = {
    Bucket: process.env.BUCKET_DOCUMENT || "cargolink-documents",
    Key: `${objectFile.type}/${objectFile.status}/${objectFile.file_name}`,
  };
  const s3 = new S3()

  return s3.getObject(params).createReadStream()
}

export const getFileFromS3V5 = () => {
  var params = {
    Bucket: "cargolink-documents",
    Key: `VEHICLE_IMAGE/FRONT/INPROGRESS/VEHICLE_IMAGE-FRONT-1624969284810.PNG`,
  };
  const s3 = new S3()
  return s3.getObject(params).createReadStream()
}
export const generateImageFromAttachCode = async (attach_code: string): Promise<object> => {
  const repo = new AttachCodeRepository()
  const result: AttachCodeModel = await repo.findByAttachCode(attach_code)
  return result
}

export async function streamToString(stream: Readable): Promise<string> {
  return await new Promise((resolve, reject) => {
    const chunks: Uint8Array[] = [];
    stream.on('data', (chunk) => chunks.push(chunk));
    stream.on('error', reject);
    stream.on('end', () => resolve(Buffer.concat(chunks).toString('utf-8')));
  });
}

// export const streamToString2 = (stream: any) => {
//   return new Promise((resolve, reject) => {
//     if (stream instanceof ReadableStream === false) {
//       reject(
//         "Expected stream to be instance of ReadableStream, but got " +
//           typeof stream
//       );
//     }
//     let text = "";
//     const decoder = new TextDecoder("utf-8");

//     const reader = stream.getReader();
//     const processRead = ({ done, value }) => {
//       if (done) {
//         // resolve promise with chunks
//         console.log("done");
//         // resolve(Buffer.concat(chunks).toString("utf8"));
//         resolve(text);
//         return;
//       }

//       text += decoder.decode(value);

//       // Not done, keep reading
//       reader.read().then(processRead);
//     };

//     // start read
//     reader.read().then(processRead);
//   });
// };

export interface AttachCodeModel {
  attach_code: string
  file_name: string
  status: string
  type: string
  expire: string
}


const generateLinkWithS3 = async (bucket: string, key: string) => {
  var params = {
    Bucket: bucket || 'cargolink-documents',
    Key: key || `VEHICLE_IMAGE/FRONT/INPROGRESS/VEHICLE_IMAGE-FRONT-1624969284810.PNG`,
  };
  const s3 = new AWS.S3({ region })
  const urlTest = await s3.getSignedUrlPromise('putObject', params)
  console.log("data : ", urlTest)
}
