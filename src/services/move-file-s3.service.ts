import AWS from 'aws-sdk'

interface paramsS3 {
  Bucket: string
  CopySource: string | undefined
  Key: string
}

export const moveFileToS3 = async (srcPath: string, srcBucket: string, destPath: string, destBucket: string, region: string) => {
    try {
        let s3 = _createS3Connection(srcBucket, region)
        let partPath = srcPath.split('/')
        let fileName = partPath[partPath.length - 1]
        let params: paramsS3 = {
            Bucket: destBucket,
            CopySource: srcBucket.concat('/').concat(srcPath),
            Key: destPath.concat(fileName)
        }
        await _copyFileToDesPath(params, s3).then().catch(e => {
            throw e
        })
        delete params.CopySource
        params.Bucket = srcBucket
        params.Key = srcPath
        await _deleteFileInSrcPath(params, s3)
        return true
    } catch (error) {
        throw error
    }
}

const _copyFileToDesPath = (params, s3) => {
    return new Promise((resolve, reject) => {
        s3.copyObject(params, (copyErr, copyData) => {
            if (copyErr && copyErr.code === 'AccessDenied') {
                reject(_createErrorFormat(copyErr, 'E10003', params.Bucket))
            }
            if (copyErr && copyErr.code === 'NoSuchKey') {
                reject(_createErrorFormat(copyErr, 'E10007', params.CopySource))
            }
            if (copyErr && copyErr.code === 'NoSuchBucket') {
                reject(_createErrorFormat(copyErr, 'E10014', params.Bucket))
            }
            if (copyErr && copyErr.code === 'InvalidArgument') {
                reject(_createErrorFormat(copyErr, 'E10018', params.CopySource))
            }
            if (copyErr && copyErr.code === 'BadRequest') {
                reject(_createErrorFormat(copyErr, 'E10019', params.Key))
            }
            if (copyErr && copyErr.code === 'InvalidBucketName') {
                reject(_createErrorFormat(copyErr, 'E10021', params.Bucket))
            } else resolve(copyData)
        })
    })
}

const _deleteFileInSrcPath = (params, s3) => {
    return new Promise((resolve) => {
        s3.deleteObject(params, (data) => {
            resolve(data)
        })
    })
}

const _createS3Connection = (bucketName, region) => {
    return new AWS.S3({
        params: {
            Bucket: bucketName
        },
        region: region
    })
}

const _createErrorFormat = (error, errorCode, source) => {
    return {
        MessageBody: source,
        MessageAttributes: {
            'TraceLogId': {
                DataType: 'String',
                StringValue: error.requestId
            },
            'Channel': {
                DataType: 'String',
                StringValue: 'System'
            },
            'ErrorCode': {
                DataType: 'String',
                StringValue: errorCode
            },
            'Function': {
                DataType: 'String',
                StringValue: '10003'
            },
            'ErrorDateTime': {
                DataType: 'String',
                StringValue: error.time
            },
            'ErrorObject': {
                DataType: 'String',
                StringValue: error
            }
        }
    }
}

