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
      TableName: table ? table : (process.env.table_attach_code || 'cgl_attach_code'),
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
      TableName: table ? table : (process.env.table_attach_code || 'cgl_attach_code'),
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
    const fromTable: string = table ? table : (process.env.table_attach_code || 'cgl_attach_code')
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
      TableName: process.env.table_attach_code || 'cgl_attach_code',
      Key: {
        attach_code: attach_code,
      },
    };

    const { Item } = await documentClient.get(params).promise();
    return Item && Object.keys(Item)?.length ? Item : null
  }

  async findByUserId(userId: string, table?: string): Promise<any> {
    const params = {
      TableName: table ? table : (process.env.table_attach_code || 'cgl_attach_code'),
      Key: {
        user_id: userId,
      },
    };

    const { Item } = await documentClient.get(params).promise();
    return Item && Object.keys(Item)?.length ? Item : null
  }

}


// const data = [
//   {
//     "attach_code": "0c9a0b4d83b022f1d61d31d4f2012c39fcd4e365ad786dcdeacc12a2d8063da6a1c52facaa7e7430745aae5bedb6a7f5ecc46b71ffe70f494d9d6fa868b05329",
//     "user_id": "testuser",
//     "expire": 1623924047,
//     "file_name": "testuser-USER_AVATAR-1623751247069",
//     "status": "ACTIVE",
//     "type": "USER_AVATAR"
//   },
//   {
//     "attach_code": "29746f10d1b729d577ceae9caea368708bf0456e9c2d773eeb59f0ef0fa4eac73f866ab31c93e185e65ccb06ae51f6a04076e89a8e0487c07fc652a07fe679df",
//     "user_id": "testuser",
//     "expire": 1623859834,
//     "file_name": "testuser-USER_AVATAR-1623687033063",
//     "status": "ACTIVE",
//     "type": "USER_AVATAR"
//   },
//   {
//     "attach_code": "29c2f86c1b6e7174b30a6f76b7a34928d8656a55adc055f7b750454de5d5acbc66364d12308d630a5f0ed5c107c4a6e9aaa701f7f687fdeacfc09d2147546eb1",
//     "user_id": "testuser",
//     "expire": 1623923876,
//     "file_name": "testuser-VEHICLE_IMAGE-FRONT-1623751074985",
//     "status": "ACTIVE",
//     "type": "VEHICLE_IMAGE/FRONT"
//   },
//   {
//     "attach_code": "522ca342d41b7e96e0bbfb64f6a9b983e58b3d3f9c96000287bff6427d293e8cc2e14b1e1d0c963f026a32610dd1241ee2ab52b11917213260d816ec76984d31",
//     "user_id": "testuser",
//     "expire": 1623923944,
//     "file_name": "testuser-VEHICLE_IMAGE-BACK-1623751144467",
//     "status": "ACTIVE",
//     "type": "VEHICLE_IMAGE/BACK"
//   },
//   {
//     "attach_code": "afed991a5ffd119a245d27d0ddfbf1f50aaec9063d6cb13158ddf07583a0ab0d4f0f96acfa02c1b2f5fb0e6a6f546188aa440ae25be9f2ec0996ca7faaff4b77",
//     "user_id": "testuser",
//     "expire": 1624007822,
//     "file_name": "testuser-VEHICLE_DOC-1623835022102",
//     "status": "INPROGRESS",
//     "type": "VEHICLE_DOC"
//   },
//   {
//     "attach_code": "f9ec3a5ef8b62aedb5f1316aad2f2181946b33b1de295a6c765d5efc78cef02f6f2f2a05c1e1d6f5d2e749db23c7fe466f5853e0b87029f853ea414d5c792e10",
//     "user_id": "testuser",
//     "expire": 1624007757,
//     "file_name": "testuser-VEHICLE_DOC-1623834956601",
//     "status": "INPROGRESS",
//     "type": "VEHICLE_DOC"
//   }
// ]
