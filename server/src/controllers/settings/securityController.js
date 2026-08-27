import { SecurityConfig } from '../../models/SecurityConfig.js'
import { auditService } from '../../services/auditService.js'

export const securityController = {
  async getSecurityConfig(req, res) {
    try {
      const { schoolId } = req.body

      let config = await SecurityConfig.findOne({ schoolId })

      if (!config) {
        config = new SecurityConfig({
          schoolId,
          passwordPolicy: {
            minLength: 8,
            requireUppercase: true,
            requireNumbers: true,
            requireSpecialChars: true,
            expiryDays: 90
          },
          sessionPolicy: {
            sessionTimeoutMinutes: 30,
            maxConcurrentSessions: 3,
            requireMFA: false
          }
        })
        await config.save()
      }

      res.json(config)
    } catch (error) {
      res.status(500).json({ message: error.message })
    }
  },

  async updateSecurityConfig(req, res) {
    try {
      const { schoolId, userId } = req.body
      const { passwordPolicy, sessionPolicy, ipWhitelist, twoFactorRequired, auditLoggingEnabled } = req.body

      let config = await SecurityConfig.findOne({ schoolId })
      if (!config) {
        config = new SecurityConfig({ schoolId })
      }

      const previousValues = config.toObject()

      if (passwordPolicy) config.passwordPolicy = passwordPolicy
      if (sessionPolicy) config.sessionPolicy = sessionPolicy
      if (ipWhitelist) config.ipWhitelist = ipWhitelist
      if (twoFactorRequired !== undefined) config.twoFactorRequired = twoFactorRequired
      if (auditLoggingEnabled !== undefined) config.auditLoggingEnabled = auditLoggingEnabled

      await config.save()

      await auditService.logAudit({
        userId,
        action: 'UPDATE',
        entityType: 'SecurityConfig',
        entityId: config._id,
        description: `Updated security configuration`,
        previousValues,
        newValues: config.toObject(),
        schoolId
      })

      res.json(config)
    } catch (error) {
      res.status(400).json({ message: error.message })
    }
  }
}
