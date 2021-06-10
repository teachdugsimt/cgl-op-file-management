import * as AWS from 'aws-sdk';

interface UserCreate {
  username: string
  password: string
  mobileNo?: string
}

const documentClient = new AWS.DynamoDB.DocumentClient()

export default class AttachCodeRepository {

  async create(data: UserCreate): Promise<any> {
    const params = {
      TableName: process.env.USER_DYNAMO || 'cgl_user_demo',
      Item: data
    };

    return documentClient.put(params).promise();
  }

  // async findAllByMobileNo(mobileNo: string): Promise<any> {
  //   const params = {
  //     TableName: process.env.USER_DYNAMO || 'cgl_user_demo',
  //     FilterExpression: "attribute_not_exists(mobileNo) or mobileNo = :null",
  //     ExpressionAttributeValues: {
  //         ':null': null
  //     }
  // }

  // dynamodb.scan(params, (err, data) => {
  //     if (err)
  //         console.log(JSON.stringify(err, null, 2));
  //     else
  //         console.log(JSON.stringify(data, null, 2));
  // })
  // }

  async findByUsername(username: string): Promise<any> {
    const params = {
      TableName: process.env.USER_DYNAMO || 'cgl_user_demo',
      Key: {
        username: username,
      },
    };

    const { Item } = await documentClient.get(params).promise();
    return Item && Object.keys(Item)?.length ? Item : null
  }

  async findByMobeilNo(mobileNo: string): Promise<any> {
    const params = {
      TableName: process.env.USER_DYNAMO || 'cgl_user_demo',
      Key: {
        mobileNo: mobileNo,
      },
    };

    const { Item } = await documentClient.get(params).promise();
    return Item && Object.keys(Item)?.length ? Item : null
  }

}
