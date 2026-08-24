import multer from 'multer'

const storage = multer.memoryStorage()
const uploader = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024
  }
})

export const uploadProjectFile = uploader
export const uploadTestImportFile = uploader
export const uploadSchoolStudentFile = uploader
