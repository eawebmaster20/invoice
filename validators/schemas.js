const Joi = require("joi");

// User validation schemas
const userRegistrationSchema = Joi.object({
  username: Joi.string().alphanum().min(3).max(30).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
});

const userLoginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

// Bill From Address validation schema
const billFromAddressSchema = Joi.object({
  companyName: Joi.string().required(),
  address: Joi.string().required(),
  city: Joi.string().required(),
  postalCode: Joi.string().required(),
  country: Joi.string().required(),
  email: Joi.string().email().required(),
  phone: Joi.string().required(),
});

// Bill To Address validation schema
const billToAddressSchema = Joi.object({
  name: Joi.string().required(),
  address: Joi.string().required(),
  city: Joi.string().required(),
  postalCode: Joi.string().required(),
  country: Joi.string().required(),
});

// Invoice Item validation schema
const invoiceItemSchema = Joi.object({
  description: Joi.string().required(),
  quantity: Joi.number().positive().required(),
  unitPrice: Joi.number().positive().required(),
  total: Joi.number().positive().required(),
});

// Invoice validation schema
const invoiceSchema = Joi.object({
  invoiceNumber: Joi.string().required(),
  invoiceDate: Joi.date().iso().required(),
  dueDate: Joi.date().iso().min(Joi.ref("invoiceDate")).required(),
  billTo: billToAddressSchema.required(),
  billFromId: Joi.number().integer().positive().required(),
  items: Joi.array().items(invoiceItemSchema).min(1).required(),
  subtotal: Joi.number().positive().required(),
  taxRate: Joi.number().min(0).max(100).required(),
  taxAmount: Joi.number().min(0).required(),
  total: Joi.number().positive().required(),
  notes: Joi.string().allow("").optional(),
});

// Payment Details validation schema
const paymentDetailsSchema = Joi.object({
  method: Joi.string().required(),
  accountName: Joi.string().required(),
  accountNumber: Joi.string().required(),
  bankName: Joi.string().required(),
  swiftCode: Joi.string().required(),
  isDefault: Joi.boolean().optional(),
});

module.exports = {
  userRegistrationSchema,
  userLoginSchema,
  billFromAddressSchema,
  billToAddressSchema,
  invoiceItemSchema,
  invoiceSchema,
  paymentDetailsSchema,
};
