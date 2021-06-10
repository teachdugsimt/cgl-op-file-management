import crypto from 'crypto'
import AttachCodeRepository, { AttachCode } from '../repositories/attach-code.dynamodb.repository'

const generateAttachCode = (length: number) => {
  const token = crypto.randomBytes(length).toString('hex');
  return token
}

const uploadAttachCode = async (code: string, filename: string) => {
  const repo = new AttachCodeRepository()
  const data: AttachCode = {
    attach_code: code,
    file_name: filename
  }
  await repo.create(data)
  return data
}

export const processAttachCode = async (filename: string) => {
  const token = generateAttachCode(64)
  const result = await uploadAttachCode(token, filename)
  return {
    ...result,
    token: result.attach_code
  }
}

