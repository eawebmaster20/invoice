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

// Client validation schema
const clientSchema = Joi.object({
  name: Joi.string().required(),
  email: Joi.string().email().allow("").optional(),
  phone: Joi.string().allow("").optional(),
  address: Joi.string().allow("").optional(),
  city: Joi.string().allow("").optional(),
  postalCode: Joi.string().allow("").optional(),
  country: Joi.string().allow("").optional(),
  taxId: Joi.string().allow("").optional(),
  notes: Joi.string().allow("").optional(),
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
  invoiceNumber: Joi.string().optional(), // Made optional since it's auto-generated
  invoiceDate: Joi.date().iso().required(),
  dueDate: Joi.date().iso().min(Joi.ref("invoiceDate")).required(),
  clientId: Joi.number().integer().positive().required(),
  billFromId: Joi.number().integer().positive().required(),
  items: Joi.array().items(invoiceItemSchema).min(1).required(),
  subtotal: Joi.number().positive().required(),
  taxRate: Joi.number().min(0).max(100).required(),
  taxAmount: Joi.number().min(0).required(),
  total: Joi.number().positive().required(),
  status: Joi.string()
    .valid("pending", "paid", "partially_paid", "overdue")
    .default("pending"),
  amountPaid: Joi.number().min(0).default(0),
  notes: Joi.string().allow("").optional(),
});

// Invoice update schema (for updating status and amount paid)
const invoiceUpdateSchema = Joi.object({
  status: Joi.string()
    .valid("pending", "paid", "partially_paid", "overdue")
    .required(),
  amountPaid: Joi.number().min(0).required(),
  notes: Joi.string().allow("").optional(),
});

// Payment Details validation schema
const paymentDetailsSchema = Joi.object({
  clientId: Joi.number().integer().positive().required(),
  invoiceId: Joi.number().integer().positive().optional(),
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
  clientSchema,
  invoiceItemSchema,
  invoiceSchema,
  invoiceUpdateSchema,
  paymentDetailsSchema,
};
