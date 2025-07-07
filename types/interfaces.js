// Type definitions for Invoice System
// Since we're using CommonJS, these are represented as JSDoc comments for documentation

/**
 * @typedef {Object} BillFromAddress
 * @property {string} companyName
 * @property {string} address
 * @property {string} city
 * @property {string} postalCode
 * @property {string} country
 * @property {string} email
 * @property {string} phone
 */

/**
 * @typedef {Object} BillToAddress
 * @property {string} name
 * @property {string} address
 * @property {string} city
 * @property {string} postalCode
 * @property {string} country
 */

/**
 * @typedef {Object} Client
 * @property {string} name
 * @property {string} email
 * @property {string} phone
 * @property {string} address
 * @property {string} city
 * @property {string} postalCode
 * @property {string} country
 * @property {string} taxId
 * @property {string} notes
 */

/**
 * @typedef {Object} InvoiceItem
 * @property {string} description
 * @property {number} quantity
 * @property {number} unitPrice
 * @property {number} total
 */

/**
 * @typedef {Object} Invoice
 * @property {string} invoiceNumber
 * @property {string} invoiceDate
 * @property {string} dueDate
 * @property {number} clientId
 * @property {Client} client
 * @property {BillFromAddress} billFrom
 * @property {InvoiceItem[]} items
 * @property {number} subtotal
 * @property {number} taxRate
 * @property {number} taxAmount
 * @property {number} total
 * @property {string} status
 * @property {number} amountPaid
 * @property {string} notes
 */

/**
 * @typedef {Object} PaymentDetails
 * @property {string} method
 * @property {string} accountName
 * @property {string} accountNumber
 * @property {string} bankName
 * @property {string} swiftCode
 */

module.exports = {};
