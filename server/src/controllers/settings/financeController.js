import { FinanceConfig } from '../../models/FinanceConfig.js'
import { auditService } from '../../services/auditService.js'

export const financeController = {
  async getFinanceConfig(req, res) {
    try {
      const { schoolId } = req.body

      let config = await FinanceConfig.findOne({ schoolId })

      if (!config) {
        config = new FinanceConfig({
          schoolId,
          currency: 'USD',
          feeStructures: [],
          paymentMethods: ['cash', 'online'],
          bankAccounts: [],
          discountRules: []
        })
        await config.save()
      }

      res.json(config)
    } catch (error) {
      res.status(500).json({ message: error.message })
    }
  },

  async updateFinanceConfig(req, res) {
    try {
      const { schoolId, userId } = req.body
      const { currency, feeStructures, paymentMethods, bankAccounts, discountRules } = req.body

      let config = await FinanceConfig.findOne({ schoolId })
      if (!config) {
        config = new FinanceConfig({ schoolId })
      }

      const previousValues = config.toObject()

      config.currency = currency || config.currency
      if (feeStructures) config.feeStructures = feeStructures
      if (paymentMethods) config.paymentMethods = paymentMethods
      if (bankAccounts) config.bankAccounts = bankAccounts
      if (discountRules) config.discountRules = discountRules

      await config.save()

      await auditService.logAudit({
        userId,
        action: 'UPDATE',
        entityType: 'FinanceConfig',
        entityId: config._id,
        description: `Updated finance configuration`,
        previousValues,
        newValues: config.toObject(),
        schoolId
      })

      res.json(config)
    } catch (error) {
      res.status(400).json({ message: error.message })
    }
  },

  async addFeeStructure(req, res) {
    try {
      const { schoolId, userId } = req.body
      const { classId, feeType, amount, frequency } = req.body

      let config = await FinanceConfig.findOne({ schoolId })
      if (!config) {
        config = new FinanceConfig({ schoolId })
      }

      config.feeStructures.push({ classId, feeType, amount, frequency })
      await config.save()

      await auditService.logAudit({
        userId,
        action: 'CREATE',
        entityType: 'FeeStructure',
        entityId: config._id,
        description: `Added fee structure for ${feeType}`,
        newValues: { feeStructure: config.feeStructures[config.feeStructures.length - 1] },
        schoolId
      })

      res.json(config)
    } catch (error) {
      res.status(400).json({ message: error.message })
    }
  }
}
