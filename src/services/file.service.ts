import {
  CompleteMultipartUploadCommand,
  CompleteMultipartUploadCommandInput,
  CreateMultipartUploadCommand,
  CreateMultipartUploadCommandInput,
  S3Client,
  UploadPartCommand,
  UploadPartCommandInput
} from '@aws-sdk/client-s3'

const client = new S3Client({ region: 'ap-southeast-1' })

export const uploadFile = async (file: Buffer, createParams: CreateMultipartUploadCommandInput): Promise<void> => {
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
  } catch (e) {
    console.log("Erro service :: ", e)
    throw e
  }
}
