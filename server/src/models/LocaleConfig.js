import mongoose from 'mongoose'

const localeConfigSchema = new mongoose.Schema(
  {
    schoolId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'School',
      required: true,
      index: true
    },
    language: {
      type: String,
      required: true
    },
    languageCode: {
      type: String,
      required: true,
      uppercase: true
    },
    isDefault: Boolean,
    isActive: { type: Boolean, default: true },
    translations: {
      type: Map,
      of: String
    },
    dateFormat: String,
    timeFormat: String,
    numberFormat: String,
    currencySymbol: String
  },
  { timestamps: true }
)

localeConfigSchema.index({ schoolId: 1, languageCode: 1 }, { unique: true })

export const LocaleConfig = mongoose.model('LocaleConfig', localeConfigSchema)
