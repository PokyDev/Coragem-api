# Coragem API

REST API for **Coragem Accessories** — a jewelry and accessories e-commerce platform. Built with Node.js, Fastify, and PostgreSQL, it powers both the public storefront catalog and the private admin panel of [coragem-web](https://coragem-web.vercel.app).

---

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js 24 |
| Framework | Fastify 5 |
| ORM | Prisma 6 |
| Database | PostgreSQL via [Neon](https://neon.tech) |
| Image storage | Cloudinary |
| Authentication | JWT + bcrypt (HttpOnly cookies) |
| Language | TypeScript 5 |
| Deploy target | AWS EC2 + Nginx + PM2 |

---

## Project Structure

```
coragem-api/
├── src/
│   ├── plugins/        # Fastify plugins (CORS, JWT, multipart, cookie)
│   ├── routes/         # Endpoint registration
│   ├── controllers/    # Request handling and response formatting
│   ├── services/       # Business logic and Prisma queries
│   ├── middleware/     # JWT authentication middleware
│   ├── schemas/        # Request validation schemas
│   ├── lib/            # Shared singletons (Prisma client, Cloudinary, config)
│   └── data/           # Static reference data (categories, colors, products)
├── prisma/
│   ├── schema.prisma   # Database schema
│   └── migrations/     # Migration history
├── .env.example        # Environment variable template
├── prisma.config.ts    # Prisma configuration
└── tsconfig.json
```

---

## Data Models

| Model | Key Fields |
|---|---|
| `Product` | `id`, `name`, `description`, `price`, `category`, `color`, `stock`, `ventas`, `isVisible` |
| `Image` | `id`, `productId`, `url`, `publicId`, `order`, `width`, `height` |
| `AdminUser` | `id`, `email`, `passwordHash` |

**Categories (enum):** `EARCUFF · ANILLO · DIJE · CADENA · TOPOS · CANDONGAS · CONJUNTOS`

**Colors (enum):** `ROJO · NEGRO · BLANCO · ROSADO · SILVER`

> Products with `stock = 0` are automatically hidden from the public catalog via `isVisible = false`.

---

## API Endpoints

### Public
| Method | Route | Description |
|---|---|---|
| `GET` | `/api/health` | Health check |
| `GET` | `/api/products` | List visible products. Supports `?category=` and `?search=` |
| `GET` | `/api/products/:id` | Product detail |

### Auth
| Method | Route | Description |
|---|---|---|
| `POST` | `/api/auth/login` | Login with email + password. Returns JWT in HttpOnly cookie |
| `POST` | `/api/auth/logout` | Invalidates session |
| `GET` | `/api/auth/me` | Authenticated admin data |

### Admin (JWT required)
| Method | Route | Description |
|---|---|---|
| `GET` | `/api/admin/products` | List all products including out-of-stock |
| `POST` | `/api/admin/products` | Create product |
| `PUT` | `/api/admin/products/:id` | Update product |
| `PATCH` | `/api/admin/products/:id/stock` | Update stock only |
| `DELETE` | `/api/admin/products/:id` | Delete product and its Cloudinary images |
| `POST` | `/api/admin/products/:id/images` | Upload images to Cloudinary |
| `PATCH` | `/api/admin/products/:id/images/reorder` | Reorder product images |
| `DELETE` | `/api/admin/images/:imageId` | Delete image from Cloudinary and DB |

---

## Local Development

### Prerequisites
- Node.js 20+
- A [Neon](https://neon.tech) PostgreSQL database
- A [Cloudinary](https://cloudinary.com) account

### Setup

```bash
# 1. Clone the repository
git clone https://github.com/PokyDev/Coragem-api.git
cd Coragem-api

# 2. Install dependencies
npm install

# 3. Configure environment variables
cp .env.example .env
# Fill in your credentials in .env

# 4. Sync the database schema
npm run db:push

# 5. Seed initial data
npm run db:seed

# 6. Start the development server
npm run dev
```

The server runs at `http://localhost:3001`. Verify with:

```bash
curl http://localhost:3001/api/health
```

### Available Scripts

| Script | Description |
|---|---|
| `npm run dev` | Start server in watch mode |
| `npm run build` | Compile TypeScript |
| `npm run start` | Run compiled output |
| `npm run db:push` | Push schema to database and generate client |
| `npm run db:migrate` | Run Prisma migrations |
| `npm run db:studio` | Open Prisma Studio |
| `npm run db:seed` | Seed initial data |

---

## Environment Variables

Copy `.env.example` to `.env` and fill in the values. Never commit `.env`.

```env
PORT=3001
NODE_ENV=development
DATABASE_URL=""
JWT_SECRET=""
JWT_EXPIRES_IN="7d"
CLOUDINARY_CLOUD_NAME=""
CLOUDINARY_API_KEY=""
CLOUDINARY_API_SECRET=""
ALLOWED_ORIGIN=""
```

---

## Related

- **Frontend:** [coragem-web](https://github.com/PokyDev/coragem-web) — Next.js storefront and admin panel
- **Design system:** Slate Command — dark admin palette documented in `coragem-admin-design-system.html`

---

*Coragem API · v1.0 · March 2026*