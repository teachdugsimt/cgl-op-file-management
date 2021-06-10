import crypto from 'crypto'

const generateAttachCode = (length: number) => {
  const token = crypto.randomBytes(length).toString('hex');
  return token
}

const uploadAttachCode = async (code: string, filename: string) => {

}

const processAttachCode = async (filename: string) => {
  const token = generateAttachCode(64)
  await uploadAttachCode(token, filename)
}

processAttachCode('test-upload.pdf')
