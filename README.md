# GREEN Supermarket - E-Commerce Platform

A modern, full-stack e-commerce platform for an online supermarket built with **Next.js**, **Go**, and **PostgreSQL**.

## Features

✅ **Online Shopping**: Browse and purchase products from a wide catalog
✅ **Safe Online Payments**: Stripe integration for secure payment processing
✅ **Shopping Cart**: Add, update, and manage items in your cart
✅ **Order Management**: Track your orders and order history
✅ **Customer Feedback**: Leave reviews and ratings on products
✅ **Admin Dashboard**: Visualize customer feedback and analytics for managerial decision-making
✅ **Email Notifications**: Automatic emails for purchase confirmation, cancellation, and payment updates
✅ **User Authentication**: Secure JWT-based authentication
✅ **Responsive Design**: Beautiful UI built with Tailwind CSS and shadcn/ui

## Tech Stack

### Frontend

- **Framework**: Next.js 16 with React 19
- **Styling**: Tailwind CSS 4, shadcn/ui
- **State Management**: Zustand
- **HTTP Client**: Axios
- **Payments**: Stripe.js
- **Charts**: Recharts
- **Notifications**: Sonner
- **Package Manager**: pnpm

### Backend

- **Language**: Go 1.21
- **Framework**: Chi Router
- **Database**: PostgreSQL with custom migrations
- **Authentication**: JWT (golang-jwt)
- **Payments**: Stripe API
- **Email**: SMTP (gopkg.in/mail.v2)
- **CORS**: go-chi/cors

### Database

- **PostgreSQL** for persistent data storage with automated migrations

## Project Structure

```
GreenSupermarket/
├── backend/                          # Go backend server
│   ├── main.go                      # Main server setup
│   ├── db.go                        # Database initialization & migrations
│   ├── models.go                    # Data models
│   ├── auth.go                      # Authentication & middleware
│   ├── email.go                     # Email service
│   ├── payment.go                   # Stripe integration
│   ├── handlers_user.go             # User endpoints
│   ├── handlers_product.go          # Product endpoints
│   ├── handlers_cart.go             # Shopping cart endpoints
│   ├── handlers_order.go            # Order endpoints
│   ├── handlers_payment.go          # Payment endpoints
│   ├── handlers_feedback.go         # Feedback endpoints
│   ├── migrations/                  # SQL migration files
│   │   └── 001_init_schema.sql     # Database schema
│   ├── go.mod                       # Go dependencies
│   └── .env.example                 # Environment variables template
│
└── frontend/                         # Next.js frontend
    ├── src/
    │   ├── app/
    │   │   ├── layout.tsx           # Root layout
    │   │   ├── page.tsx             # Home page
    │   │   ├── globals.css          # Global styles
    │   │   ├── products/            # Products page
    │   │   ├── login/               # Login page
    │   │   ├── register/            # Registration page
    │   │   ├── cart/                # Shopping cart page
    │   │   ├── checkout/            # Checkout page
    │   │   ├── orders/              # Orders history page
    │   │   ├── order-confirmation/  # Order confirmation page
    │   │   └── admin/               # Admin dashboard
    │   ├── components/
    │   │   ├── navbar.tsx           # Navigation bar
    │   │   └── product-card.tsx     # Product card component
    │   └── lib/
    │       ├── api.ts               # API client
    │       └── store.ts             # Zustand store
    ├── package.json
    ├── tsconfig.json
    ├── next.config.ts
    ├── tailwind.config.ts
    ├── postcss.config.ts
    ├── biome.json
    └── .env.example                 # Environment variables template
```

## Setup Instructions

### 1. Prerequisites

- **Node.js 18+** and **pnpm** for frontend
- **Go 1.21+** for backend
- **PostgreSQL 14+** database
- **Git** for version control

### 2. Database Setup

```bash
# Create PostgreSQL database
createdb Supermarket

# Verify connection
psql -U postgres -d Supermarket -c "SELECT 1;"
```

### 3. Backend Setup

```bash
cd backend

# Copy environment file and update credentials
cp .env.example .env

# Edit .env with your configuration (database, Stripe keys, email settings)
# DATABASE_URL=host=localhost port=5432 user=postgres password=zaq123 dbname=Supermarket sslmode=disable
# STRIPE_SECRET_KEY=sk_test_your_key
# SMTP_USER=your-email@gmail.com
# SMTP_PASSWORD=your-app-password

# Download dependencies
go mod download

# Run server (migrations run automatically)
go run .

# Server starts on http://localhost:8080
```

### 4. Frontend Setup

```bash
cd frontend

# Copy environment file
cp .env.example .env.local

# Edit .env.local with your API URL and Stripe public key
# NEXT_PUBLIC_API_URL=http://localhost:8080
# NEXT_PUBLIC_STRIPE_PUBLIC_KEY=pk_test_your_key

# Install dependencies
pnpm install

# Run development server
pnpm dev

# Application starts on http://localhost:3000
```

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user

### Products

- `GET /api/products` - Get all products (with filtering)
- `GET /api/products/:id` - Get specific product
- `GET /api/categories` - Get product categories
- `POST /api/products` - Create product (admin only)
- `PUT /api/products/:id` - Update product (admin only)

### Shopping Cart

- `GET /api/cart` - Get user's cart
- `POST /api/cart/items` - Add item to cart
- `PUT /api/cart/items/:id` - Update cart item quantity
- `DELETE /api/cart/items/:id` - Remove item from cart
- `DELETE /api/cart/clear` - Clear entire cart

### Orders

- `POST /api/orders` - Create new order
- `GET /api/orders` - Get user's orders
- `GET /api/orders/:id` - Get specific order
- `POST /api/orders/:id/cancel` - Cancel order

### Payments

- `POST /api/payments` - Create payment intent
- `POST /api/payments/confirm` - Confirm payment
- `GET /api/payments/:id` - Get payment status
- `GET /api/payments/public-key` - Get Stripe public key

### Feedback

- `POST /api/feedback` - Create feedback
- `GET /api/feedback` - Get user's feedback
- `GET /api/products/:id/feedback` - Get product feedback
- `GET /api/admin/feedback` - Get all feedback (admin only)
- `GET /api/admin/feedback/stats` - Get feedback statistics (admin only)

### User

- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update user profile

## Configuration

### Stripe Sandbox Setup

1. Create account at [stripe.com](https://stripe.com)
2. Get API keys from Dashboard > Developers > API Keys
3. Add keys to backend `.env`:
   ```
   STRIPE_SECRET_KEY=sk_test_your_secret_key
   STRIPE_PUBLIC_KEY=pk_test_your_public_key
   ```

### Email Setup (Gmail)

1. Enable 2FA on Gmail account
2. Generate app-specific password (not regular password)
3. Add to backend `.env`:
   ```
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your-email@gmail.com
   SMTP_PASSWORD=your-app-specific-password
   FROM_EMAIL=noreply@greensupermarket.com
   ```

## Database Migrations

Migrations run automatically on server startup. They:

- Create all necessary tables (users, products, orders, feedback, etc.)
- Set up relationships and constraints
- Create indexes for performance

To manually check migrations:

```bash
psql -U postgres -d Supermarket -c "\dt"
```

## Running the Application

### Terminal 1: Backend

```bash
cd backend
go run .
# Server runs on http://localhost:8080
```

### Terminal 2: Frontend

```bash
cd frontend
pnpm dev
# App runs on http://localhost:3000
```

### Admin Utilities

Run these from the `backend/` directory:

```bash
go run ./cmd/admin-setup test@example.com
go run ./cmd/admin-reset MyAdminPassword123
```

### Test Credentials

- **Email**: test@example.com
- **Password**: password123

## Features in Detail

### 1. Online Shopping

- Browse products by category
- Search functionality
- Add items to cart with custom quantities
- Real-time cart updates

### 2. Secure Checkout

- Multi-step checkout process
- Shipping address entry
- Stripe payment integration
- Order confirmation

### 3. Order Management

- View order history
- Track order status
- Cancel orders (if applicable)
- Detailed order information

### 4. Customer Feedback

- Leave ratings and reviews
- Product-based feedback
- Order-based feedback
- View all product feedback

### 5. Admin Dashboard

- View feedback visualization
- Analytics and statistics
- Rating distribution charts
- Customer insights for decision-making

### 6. Email Notifications

- Welcome email on registration
- Order confirmation emails
- Payment confirmation emails
- Order cancellation emails

## Performance Optimizations

- Database indexes on frequently queried columns
- JWT-based authentication (no session overhead)
- Responsive design for all device sizes
- Environment-based configuration

## Security Features

- Password hashing with bcrypt
- JWT token-based authentication
- Secure payment handling with Stripe
- CORS protection
- Input validation on all endpoints

## Future Enhancements

- Product images upload
- Wishlist functionality
- Product recommendations
- Advanced analytics
- Inventory management
- Discount codes
- User reviews with images
- Mobile app (React Native)

## Troubleshooting

### Backend Issues

- **Database connection error**: Check DATABASE_URL in .env
- **Port already in use**: Change PORT in .env or kill process using port 8080
- **Migration errors**: Ensure PostgreSQL is running and database exists

### Frontend Issues

- **API connection error**: Verify NEXT_PUBLIC_API_URL in .env.local
- **Stripe errors**: Check NEXT_PUBLIC_STRIPE_PUBLIC_KEY is correct
- **Port already in use**: Run `pnpm next dev -p 3001` for different port

### Payment Issues

- **Stripe test cards**: Use `4242 4242 4242 4242` with any future expiry
- **Test mode only**: Stripe sandbox credentials don't process real payments

## Support & Documentation

- Backend API: `http://localhost:8080/health`
- Frontend: `http://localhost:3000`
- Stripe Docs: https://stripe.com/docs
- Next.js Docs: https://nextjs.org/docs
- Go Docs: https://golang.org/doc

## License

This project is created for GREEN Supermarket. All rights reserved.

---

**Created with ❤️ for GREEN Supermarket**
