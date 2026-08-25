import { connectDb } from '../config/db.js'
import { migrateUsersForUnifiedAuth } from '../services/userMigrationService.js'

const isDryRun = process.argv.includes('--dry-run')

const runUsersForUnifiedAuthMigration = async () => {
  await connectDb()
  const stats = await migrateUsersForUnifiedAuth({ dryRun: isDryRun })

  console.log('User migration summary (unified auth):')
  console.table(stats)

  if (isDryRun) {
    console.log('Dry run mode: no database changes were written.')
  }
}

runUsersForUnifiedAuthMigration()
  .then(() => {
    process.exit(0)
  })
  .catch((error) => {
    console.error('User migration failed:', error)
    process.exit(1)
  })
