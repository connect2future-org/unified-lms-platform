import multer from 'multer'

const storage = multer.memoryStorage()
const uploader = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024
  }
})

export const uploadProjectFile = uploader
export const uploadTestImportFile = uploader
export const uploadSchoolStudentFile = uploader
