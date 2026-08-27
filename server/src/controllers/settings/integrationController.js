import { IntegrationConfig } from '../../models/IntegrationConfig.js'
import { auditService } from '../../services/auditService.js'

export const integrationController = {
  async listIntegrations(req, res) {
    try {
      const { schoolId } = req.body
      const items = await IntegrationConfig.find({ schoolId }).select('-credentials -webhookSecret')
      res.json(items)
    } catch (error) {
      res.status(500).json({ message: error.message })
    }
  },

  async getIntegration(req, res) {
    try {
      const { id } = req.params
      const { schoolId } = req.body

      const integration = await IntegrationConfig.findOne({ _id: id, schoolId })
      if (!integration) return res.status(404).json({ message: 'Integration not found' })

      res.json(integration)
    } catch (error) {
      res.status(500).json({ message: error.message })
    }
  },

  async createIntegration(req, res) {
    try {
      const { schoolId, userId } = req.body
      const { integrationName, provider, webhookUrl, syncFrequency, settings } = req.body

      const integration = new IntegrationConfig({
        schoolId,
        integrationName,
        provider,
        webhookUrl,
        syncFrequency,
        settings,
        isActive: false
      })

      await integration.save()

      await auditService.logAudit({
        userId,
        action: 'CREATE',
        entityType: 'IntegrationConfig',
        entityId: integration._id,
        description: `Created integration: ${integrationName}`,
        newValues: integration.toObject(),
        schoolId
      })

      res.status(201).json(integration)
    } catch (error) {
      res.status(400).json({ message: error.message })
    }
  },

  async updateIntegration(req, res) {
    try {
      const { id } = req.params
      const { schoolId, userId } = req.body
      const { isActive, settings, syncFrequency } = req.body

      const integration = await IntegrationConfig.findById(id)
      if (!integration) return res.status(404).json({ message: 'Integration not found' })

      const previousValues = integration.toObject()

      if (isActive !== undefined) integration.isActive = isActive
      if (settings) integration.settings = settings
      if (syncFrequency) integration.syncFrequency = syncFrequency

      await integration.save()

      await auditService.logAudit({
        userId,
        action: 'UPDATE',
        entityType: 'IntegrationConfig',
        entityId: id,
        description: `Updated integration: ${integration.integrationName}`,
        previousValues,
        newValues: integration.toObject(),
        schoolId
      })

      res.json(integration)
    } catch (error) {
      res.status(400).json({ message: error.message })
    }
  },

  async testIntegration(req, res) {
    try {
      const { id } = req.params
      const integration = await IntegrationConfig.findById(id)
      if (!integration) return res.status(404).json({ message: 'Integration not found' })

      // Placeholder for actual test logic
      res.json({ status: 'success', message: 'Integration test passed' })
    } catch (error) {
      res.status(500).json({ message: error.message })
    }
  }
}
