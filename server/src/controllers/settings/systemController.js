import { SystemConfig } from '../../models/SystemConfig.js'
import { auditService } from '../../services/auditService.js'

export const systemController = {
  async getSystemConfig(req, res) {
    try {
      const { schoolId } = req.body

      let config = await SystemConfig.findOne({ schoolId })

      if (!config) {
        config = new SystemConfig({
          schoolId,
          language: 'en',
          timezone: 'UTC',
          features: {
            attendanceModule: true,
            assessmentModule: true,
            communicationModule: true,
            financeModule: false,
            parentPortal: true,
            studentPortal: true
          }
        })
        await config.save()
      }

      res.json(config)
    } catch (error) {
      res.status(500).json({ message: error.message })
    }
  },

  async updateSystemConfig(req, res) {
    try {
      const { schoolId, userId } = req.body
      const { systemName, language, timezone, features, maintenanceMode } = req.body

      let config = await SystemConfig.findOne({ schoolId })
      if (!config) {
        config = new SystemConfig({ schoolId })
      }

      const previousValues = config.toObject()

      if (systemName) config.systemName = systemName
      if (language) config.language = language
      if (timezone) config.timezone = timezone
      if (features) config.features = { ...config.features, ...features }
      if (maintenanceMode !== undefined) config.maintenanceMode = maintenanceMode

      await config.save()

      await auditService.logAudit({
        userId,
        action: 'UPDATE',
        entityType: 'SystemConfig',
        entityId: config._id,
        description: `Updated system configuration`,
        previousValues,
        newValues: config.toObject(),
        schoolId
      })

      res.json(config)
    } catch (error) {
      res.status(400).json({ message: error.message })
    }
  },

  async toggleFeature(req, res) {
    try {
      const { schoolId, userId } = req.body
      const { feature, enabled } = req.body

      let config = await SystemConfig.findOne({ schoolId })
      if (!config) {
        config = new SystemConfig({ schoolId })
      }

      const previousValues = config.toObject()
      config.features[feature] = enabled
      await config.save()

      await auditService.logAudit({
        userId,
        action: 'UPDATE',
        entityType: 'SystemConfig',
        entityId: config._id,
        description: `${enabled ? 'Enabled' : 'Disabled'} feature: ${feature}`,
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
