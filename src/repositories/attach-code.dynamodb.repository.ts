import * as AWS from 'aws-sdk';
import { DocumentClient } from 'aws-sdk/clients/dynamodb';
import { DH_NOT_SUITABLE_GENERATOR } from 'constants';

export interface AttachCode {
  attach_code: string
  file_name: string
  user_id?: string
  type?: string
  status?: string
}

const documentClient = new AWS.DynamoDB.DocumentClient({ region: 'ap-southeast-1' })

export default class AttachCodeRepository {

  async create(data: AttachCode, table?: string): Promise<any> {
    const params = {
      TableName: table ? table : (process.env.TABLE_ATTACH_CODE || 'cgl_attach_code'),
      Item: data
    };

    return documentClient.put(params).promise();
  }

  async updateStatus(attachCodeObject: any, status: string, attributename: string, table?: string) {
    // let expressionAttr = {}
    // const attr = `:${attributename}`
    // expressionAttr[attr] = status
    // ExpressionAttributeValues: { ":status": status }
    const params: DocumentClient.UpdateItemInput = {
      TableName: table ? table : (process.env.TABLE_ATTACH_CODE || 'cgl_attach_code'),
      Key: {
        ...attachCodeObject
      },
      UpdateExpression: `SET #${attributename} = :${attributename}`,
      ExpressionAttributeNames: {
        [`#${attributename}`]: attributename
      },
      ExpressionAttributeValues: { [`:${attributename}`]: status }
      // ExpressionAttributeValues: { ...expressionAttr }
    }
    return documentClient.update(params).promise()
  }

  async queryFromAttachCode(tokenArray: string[], table?: string): Promise<any> {
    const mappingArray: { attach_code: string }[] = []
    const fromTable: string = table ? table : (process.env.TABLE_ATTACH_CODE || 'cgl_attach_code')
    tokenArray.map(e => mappingArray.push({ attach_code: e }))
    const params: DocumentClient.BatchGetItemInput = {
      "RequestItems": {
        [`${fromTable}`]: {
          "Keys": mappingArray
        }
      },
    };
    const data = await documentClient.batchGet(params).promise()
    return data.Responses && data.Responses[fromTable] ? data?.Responses[fromTable] : []
  }

  async findByAttachCode(attach_code: string): Promise<any> {
    const params = {
      TableName: process.env.TABLE_ATTACH_CODE || 'cgl_attach_code',
      Key: {
        attach_code: attach_code,
      },
    };

    const { Item } = await documentClient.get(params).promise();
    return Item && Object.keys(Item)?.length ? Item : null
  }

  async findByUserId(userId: string, table?: string): Promise<any> {
    const params = {
      TableName: table ? table : (process.env.TABLE_ATTACH_CODE || 'cgl_attach_code'),
      Key: {
        user_id: userId,
      },
    };

    const { Item } = await documentClient.get(params).promise();
    return Item && Object.keys(Item)?.length ? Item : null
  }

  async queryWithFilenameBegin(str: string): Promise<any> {
    const params: DocumentClient.ScanInput = {
      TableName: "cgl_attach_code",
      FilterExpression: 'begins_with(#user_id, :user_id)',
      ExpressionAttributeValues: {
        ':user_id': str
      },
      ExpressionAttributeNames: {
        '#user_id': "user_id"
      },
    };
    return await documentClient.scan(params).promise();
  }

  async queryByUserIdAndType(userId: string = " ", type: string = " "): Promise<any> {
    const params: DocumentClient.ScanInput = {
      TableName: "cgl_attach_code",
      FilterExpression: '#user_id = :user_id and #ty = :ty',
      ExpressionAttributeValues: {
        ':user_id': userId,
        ':ty': type
      },
      ExpressionAttributeNames: {
        '#user_id': "user_id",
        "#ty": "type"
      },
    };
    return await documentClient.scan(params).promise();
  }

}

// const main = async () => {
//   const repo = new AttachCodeRepository()
//   const res = await repo.queryByUserIdAndType("artist88", "USER_DOC")
//   console.log("Result : ", res)
// }
// main()
