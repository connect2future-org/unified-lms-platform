import { initializeDefaultRoles } from '../services/permissionService.js'

export const initializePermissionSystem = async () => {
  try {
    await initializeDefaultRoles()
    console.log('✓ Permission system initialized successfully')
  } catch (error) {
    console.error('✗ Failed to initialize permission system:', error)
  }
}
