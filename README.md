# Invoice Server

A comprehensive Node.js Express server for managing invoices, built with MySQL and bcrypt authentication.

## Features

- 🔐 User authentication with JWT tokens
- 📄 Invoice management (CRUD operations)
- 🏢 Company billing address management
- 💳 Payment details management
- 🔒 Secure password hashing with bcrypt
- ✅ Request validation with Joi
- 📊 MySQL database with connection pooling
- 🛡️ Security headers with Helmet
- 🌐 CORS enabled
- 🔧 Development mode with bypassed security (API_SECURE=false)

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MySQL
- **Authentication**: JWT + bcrypt
- **Validation**: Joi
- **Security**: Helmet, CORS

## Installation

1. Clone the repository:

```bash
git clone <repository-url>
cd invoice-server
```

2. Install dependencies:

```bash
npm install
```

3. Set up environment variables:

```bash
cp .env.example .env
# Edit .env with your database credentials
```

4. Set up MySQL database:

- Create a new database named `invoice_db` (or your preferred name)
- Update the database configuration in `.env`

5. Start the server:

```bash
# Development mode with auto-restart
npm run dev

# Production mode
npm start
```

## Environment Variables

```env
# Database Configuration
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=invoice_db
DB_PORT=3306
DB_RESET=false

# Server Configuration
PORT=3000
NODE_ENV=development
API_SECURE=true

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_here_change_this_in_production
JWT_EXPIRES_IN=24h

# Bcrypt Configuration
BCRYPT_ROUNDS=12
```

### Database Configuration

- **`DB_RESET`**: Controls database table management at startup
  - `false` (default): Tables are created if they don't exist
  - `true`: **⚠️ WARNING**: All existing tables will be dropped and recreated on startup
  - Use with caution as this will **permanently delete all data**

### API_SECURE Configuration

The `API_SECURE` environment variable controls whether authentication and validation are enforced:

- **`API_SECURE=true`** (default): Full security enabled

  - JWT token authentication required for protected routes
  - Request validation enforced
  - Recommended for production environments

- **`API_SECURE=false`**: Development mode with bypassed security
  - ⚠️ **WARNING**: Authentication and validation are completely bypassed
  - All protected routes become accessible without tokens
  - Mock user (`userId: 1`) is automatically injected
  - Should **ONLY** be used for development and testing
  - Server will display security warnings on startup

## API Endpoints

### Authentication

#### Register User

```http
POST /api/users/register
Content-Type: application/json

{
  "username": "johndoe",
  "email": "john@example.com",
  "password": "securepassword123"
}
```

#### Login User

```http
POST /api/users/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "securepassword123"
}
```

#### Get User Profile

```http
GET /api/users/profile
Authorization: Bearer <your-jwt-token>
```

### Bill From Addresses

#### Create Bill From Address

```http
POST /api/bill-from-addresses
Authorization: Bearer <your-jwt-token>
Content-Type: application/json

{
  "companyName": "ACME Corp",
  "address": "123 Business St",
  "city": "New York",
  "postalCode": "10001",
  "country": "USA",
  "email": "billing@acme.com",
  "phone": "+1-555-0123"
}
```

#### Get All Bill From Addresses

```http
GET /api/bill-from-addresses
Authorization: Bearer <your-jwt-token>
```

#### Get Bill From Address by ID

```http
GET /api/bill-from-addresses/:id
Authorization: Bearer <your-jwt-token>
```

#### Update Bill From Address

```http
PUT /api/bill-from-addresses/:id
Authorization: Bearer <your-jwt-token>
Content-Type: application/json

{
  "companyName": "ACME Corp Updated",
  "address": "456 Business Ave",
  "city": "New York",
  "postalCode": "10001",
  "country": "USA",
  "email": "billing@acme.com",
  "phone": "+1-555-0123"
}
```

#### Delete Bill From Address

```http
DELETE /api/bill-from-addresses/:id
Authorization: Bearer <your-jwt-token>
```

### Payment Details

#### Create Payment Details

```http
POST /api/payment-details
Authorization: Bearer <your-jwt-token>
Content-Type: application/json

{
  "clientId": 1,
  "invoiceId": 1,
  "method": "Bank Transfer",
  "accountName": "ACME Corp",
  "accountNumber": "1234567890",
  "bankName": "First National Bank",
  "swiftCode": "FNBKUS33",
  "isDefault": true
}
```

#### Get All Payment Details

```http
GET /api/payment-details
Authorization: Bearer <your-jwt-token>
```

#### Get Payment Details by ID

```http
GET /api/payment-details/:id
Authorization: Bearer <your-jwt-token>
```

#### Update Payment Details

```http
PUT /api/payment-details/:id
Authorization: Bearer <your-jwt-token>
Content-Type: application/json

{
  "method": "Bank Transfer",
  "accountName": "ACME Corp",
  "accountNumber": "1234567890",
  "bankName": "First National Bank",
  "swiftCode": "FNBKUS33",
  "isDefault": true
}
```

#### Delete Payment Details

```http
DELETE /api/payment-details/:id
Authorization: Bearer <your-jwt-token>
```

### Clients

#### Create Client

```http
POST /api/clients
Authorization: Bearer <your-jwt-token>
Content-Type: application/json

{
  "name": "ACME Corporation",
  "email": "contact@acme.com",
  "phone": "+1-555-0123",
  "address": "123 Business St",
  "city": "New York",
  "postalCode": "10001",
  "country": "USA",
  "taxId": "12-3456789",
  "notes": "Important client"
}
```

#### Get All Clients

```http
GET /api/clients
Authorization: Bearer <your-jwt-token>
```

#### Get Client by ID

```http
GET /api/clients/:id
Authorization: Bearer <your-jwt-token>
```

#### Update Client

```http
PUT /api/clients/:id
Authorization: Bearer <your-jwt-token>
Content-Type: application/json

{
  "name": "ACME Corporation Updated",
  "email": "contact@acme.com",
  "phone": "+1-555-0123",
  "address": "456 Business Ave",
  "city": "New York",
  "postalCode": "10001",
  "country": "USA",
  "taxId": "12-3456789",
  "notes": "Updated client information"
}
```

#### Delete Client

```http
DELETE /api/clients/:id
Authorization: Bearer <your-jwt-token>
```

### Invoices

#### Create Invoice

```http
POST /api/invoices
Authorization: Bearer <your-jwt-token>
Content-Type: application/json

{
  "invoiceNumber": "INV-001",
  "invoiceDate": "2025-01-01",
  "dueDate": "2025-02-01",
  "clientId": 1,
  "billFromId": 1,
  "items": [
    {
      "description": "Web Development Services",
      "quantity": 40,
      "unitPrice": 100.00,
      "total": 4000.00
    },
    {
      "description": "Domain Registration",
      "quantity": 1,
      "unitPrice": 15.00,
      "total": 15.00
    }
  ],
  "subtotal": 4015.00,
  "taxRate": 8.5,
  "taxAmount": 341.28,
  "total": 4356.28,
  "status": "pending",
  "amountPaid": 0.00,
  "notes": "Payment due within 30 days"
}
```

#### Get All Invoices

```http
GET /api/invoices
Authorization: Bearer <your-jwt-token>
```

#### Get Invoice by ID

```http
GET /api/invoices/:id
Authorization: Bearer <your-jwt-token>
```

#### Delete Invoice

```http
DELETE /api/invoices/:id
Authorization: Bearer <your-jwt-token>
```

### Health Check

#### Server Health

```http
GET /health
```

## Data Types

### BillFromAddress

```typescript
{
  companyName: string;
  address: string;
  city: string;
  postalCode: string;
  country: string;
  email: string;
  phone: string;
}
```

### Client

```typescript
{
  id: number;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  postalCode?: string;
  country?: string;
  taxId?: string;
  notes?: string;
}
```

### InvoiceItem

```typescript
{
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}
```

### Invoice

```typescript
{
  invoiceNumber: string;
  invoiceDate: string; // ISO date format
  dueDate: string; // ISO date format
  clientId: number;
  billFromId: number;
  items: InvoiceItem[];
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  status: 'pending' | 'paid' | 'partially_paid' | 'overdue';
  amountPaid: number;
  notes?: string;
}
```

### PaymentDetails

```typescript
{
  clientId: number;
  invoiceId: number;
  method: string;
  accountName: string;
  accountNumber: string;
  bankName: string;
  swiftCode: string;
}
```

## Database Schema

The server automatically creates the following tables with their relationships:

### Tables

- **`users`** - User accounts and authentication
- **`bill_from_addresses`** - Company billing addresses (belongs to users)
- **`clients`** - Client information (global, not user-specific)
- **`invoices`** - Invoice records (belongs to users and clients)
- **`invoice_items`** - Line items for invoices (belongs to invoices)
- **`payment_details`** - Payment method information (belongs to clients and invoices)

### Key Relationships

- **Users** can have multiple **Bill From Addresses**
- **Users** can create multiple **Invoices**
- **Clients** are global entities (not tied to specific users)
- **Invoices** belong to both a **User** (creator) and a **Client** (recipient)
- **Invoices** can have multiple **Invoice Items**
- **Payment Details** belong to both **Clients** and **Invoices**
- **Invoices** include status tracking (pending, paid, partially_paid, overdue) and amount_paid

### Invoice Status Management

Invoices support the following statuses:

- `pending` - Default status for new invoices
- `paid` - Invoice has been fully paid
- `partially_paid` - Invoice has been partially paid
- `overdue` - Invoice is past due date

Each invoice tracks the `amount_paid` separately from the total amount.

## Security Features

- Password hashing with bcrypt
- JWT token authentication
- SQL injection protection with parameterized queries
- CORS configuration
- Security headers with Helmet
- Request validation with Joi
- User-based data isolation

## Error Handling

The API returns consistent error responses:

```json
{
  "error": "Error type",
  "message": "Detailed error message"
}
```

Common HTTP status codes:

- `200` - Success
- `201` - Created
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (authentication required)
- `403` - Forbidden (invalid token)
- `404` - Not Found
- `409` - Conflict (duplicate data)
- `500` - Internal Server Error

## Development

### Prerequisites

- Node.js 16+
- MySQL 8.0+
- npm or yarn

### Scripts

- `npm start` - Start production server
- `npm run dev` - Start development server with auto-restart

### Testing

You can test the API using tools like:

- Postman
- Insomnia
- curl
- Thunder Client (VS Code extension)

## License

MIT License - see LICENSE file for details.

## Support

For support and questions, please contact eawebmaster20.
