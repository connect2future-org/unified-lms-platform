import mongoose from 'mongoose'

const financeConfigSchema = new mongoose.Schema(
  {
    schoolId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'School',
      required: true,
      unique: true,
      index: true
    },
    currency: {
      type: String,
      default: 'USD'
    },
    feeStructures: [{
      classId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Class'
      },
      feeType: String,
      amount: Number,
      frequency: {
        type: String,
        enum: ['monthly', 'quarterly', 'halfyearly', 'annual'],
        default: 'annual'
      },
      dueDate: Date,
      lateFeePercentage: Number
    }],
    paymentMethods: [
      {
        type: String,
        enum: ['cash', 'cheque', 'transfer', 'online', 'upi'],
        default: ['cash', 'online']
      }
    ],
    bankAccounts: [{
      accountHolder: String,
      accountNumber: String,
      bankName: String,
      ifscCode: String,
      accountType: String
    }],
    discountRules: [{
      name: String,
      type: {
        type: String,
        enum: ['percentage', 'fixed']
      },
      value: Number,
      applicableTo: [String]
    }]
  },
  { timestamps: true }
)

export const FinanceConfig = mongoose.model('FinanceConfig', financeConfigSchema)
