import { LocaleConfig } from '../../models/LocaleConfig.js'
import { auditService } from '../../services/auditService.js'

export const localeController = {
  async listLocales(req, res) {
    try {
      const { schoolId } = req.body
      const items = await LocaleConfig.find({ schoolId, isActive: true })
      res.json(items)
    } catch (error) {
      res.status(500).json({ message: error.message })
    }
  },

  async getLocale(req, res) {
    try {
      const { id } = req.params
      const { schoolId } = req.body

      const locale = await LocaleConfig.findOne({ _id: id, schoolId })
      if (!locale) return res.status(404).json({ message: 'Locale not found' })

      res.json(locale)
    } catch (error) {
      res.status(500).json({ message: error.message })
    }
  },

  async createLocale(req, res) {
    try {
      const { schoolId, userId } = req.body
      const { language, languageCode, isDefault, translations } = req.body

      const locale = new LocaleConfig({
        schoolId,
        language,
        languageCode: languageCode.toUpperCase(),
        isDefault,
        translations,
        isActive: true
      })

      await locale.save()

      await auditService.logAudit({
        userId,
        action: 'CREATE',
        entityType: 'LocaleConfig',
        entityId: locale._id,
        description: `Created locale: ${language}`,
        newValues: locale.toObject(),
        schoolId
      })

      res.status(201).json(locale)
    } catch (error) {
      res.status(400).json({ message: error.message })
    }
  },

  async updateLocale(req, res) {
    try {
      const { id } = req.params
      const { schoolId, userId } = req.body
      const { language, translations, isDefault } = req.body

      const locale = await LocaleConfig.findById(id)
      if (!locale) return res.status(404).json({ message: 'Locale not found' })

      const previousValues = locale.toObject()

      if (language) locale.language = language
      if (translations) locale.translations = translations
      if (isDefault !== undefined) locale.isDefault = isDefault

      await locale.save()

      await auditService.logAudit({
        userId,
        action: 'UPDATE',
        entityType: 'LocaleConfig',
        entityId: id,
        description: `Updated locale: ${locale.language}`,
        previousValues,
        newValues: locale.toObject(),
        schoolId
      })

      res.json(locale)
    } catch (error) {
      res.status(400).json({ message: error.message })
    }
  }
}
