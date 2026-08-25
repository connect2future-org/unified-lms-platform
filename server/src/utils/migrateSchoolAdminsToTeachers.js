import { connectDb } from '../config/db.js'
import { User } from '../models/User.js'

const migrate = async () => {
  await connectDb()
  const result = await User.updateMany(
    { role: 'admin', schoolId: { $ne: null } },
    { $set: { role: 'teacher' } }
  )
  console.log(`Migrated ${result.modifiedCount} school-assigned admin users to teacher.`)
  process.exit(0)
}

migrate().catch((error) => {
  console.error('School teacher migration failed:', error)
  process.exit(1)
})