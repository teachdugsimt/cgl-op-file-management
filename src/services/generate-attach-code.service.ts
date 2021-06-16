import crypto from 'crypto'
import AttachCodeRepository, { AttachCode } from '../repositories/attach-code.dynamodb.repository'

const generateAttachCode = (length: number) => {
  const token = crypto.randomBytes(length).toString('hex');
  return token
}

const addDays = (date: Date, days: number) => {
  var result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

const uploadAttachCode = async (code: string, parseFileName: string, userId: string, frontPath: string, statusPath: string) => {
  const repo = new AttachCodeRepository()
  let now = new Date()
  let nowAddDays = addDays(now, 2)
  let newTime = nowAddDays.getTime()
  const data: AttachCode = {
    attach_code: code,
    file_name: parseFileName,
    user_id: userId,
    type: frontPath,
    status: statusPath,
  }
  const params = {
    ...data,
    expire: Math.floor(newTime / 1000),
  }
  await repo.create(params)
  return data
}

export const processAttachCode = async (parseFileName: string, userId: string, frontPath: string, statusPath: string) => {
  const token = generateAttachCode(64)
  const result = await uploadAttachCode(token, parseFileName, userId, frontPath, statusPath)
  console.log("Result service :: ", result)
  return { ...result }
}
