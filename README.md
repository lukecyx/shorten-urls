# URL Shortener Service

A serverless URL shortener running on AWS Lambda + API Gateway with PostgreSQL and Redis.

## Features

- **Unique Short Codes**: 6-character Base58 encoded codes
- **Collision-Resistant**: Uses Snowflake ID + Feistel cipher for guaranteed uniqueness
- **Serverless**: AWS Lambda with automatic scaling
- **Fast Lookups**: PostgreSQL with Redis caching
- **Local Development**: Full local stack with hot reload

## Quick Start

### Prerequisites

- Node.js 20+
- Docker Desktop
- AWS SAM CLI (`brew install aws-sam-cli`)

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd shorten-urls

# Install dependencies
npm install

# Setup local database
npm run db:setup
```

### Local Development

Start the development server:

```bash
npm run dev
```

The API will be available at `http://localhost:3000`

#### Available Commands

```bash
# Development
npm run dev              # Start local dev server
npm run dev:watch        # Start local dev server & watch changes. Rebuilds SAM manually.
npm run build:layers     # Build Lambda layers
npm run docker:up        # Start Docker services
npm run docker:down      # Stop Docker services
npm run docker:logs      # View Docker logs

# Database
npm run db:setup         # First-time setup
npm run db:migrate       # Run migrations
npm run db:studio        # Open Prisma Studio

# Testing
npm run test             # Run tests with Vitest

# Deployment
cd infra && npx cdk deploy --all
```

#### Project Structure

```
.
├── src/
│   ├── urls/
│   │   ├── handlers/       # Lambda handler functions
│   │   ├── controller.ts   # Business logic
│   │   └── schemas.ts      # Zod validation schemas
│   ├── services/           # Core services (URL encoding, etc.)
│   ├── lib/               # Utilities (logger, middleware)
│   └── config/            # Environment configuration
├── infra/
│   ├── stacks/            # CDK infrastructure stacks
│   └── lambda-layers/     # Snowflake & Encoding layers
├── prisma/
│   └── schema.prisma      # Database schema
├── template.yaml          # SAM template (local dev)
└── docker-compose.yml     # PostgreSQL + Redis
```

#### Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/shorten_urls?connection_limit=5&pool_timeout=10"
FEISTEL_SECRET="your-secret-key-here"
FEISTEL_ROUNDS="4"
DOMAIN_BITS="64"
CODE_BASE="58"
CODE_LENGTH="6"
```

For SAM local development, also configure `env.json` (see `env.json.example`).

#### Local Architecture

```
┌─────────────────────────────────────────────────────┐
│                  Your Computer                      │
│                                                     │
│  ┌────────────────┐         ┌─────────────────┐     │
│  │  SAM CLI       │         │  Docker Compose │     │
│  │  (port 3000)   │────────▶│  - PostgreSQL   │     │
│  │                │         │  - Redis        │     │
│  │  ┌──────────┐  │         └─────────────────┘     │
│  │  │ Lambda 1 │  │                                 │
│  │  │ (create) │  │                                 │
│  │  └──────────┘  │                                 │
│  │  ┌──────────┐  │                                 │
│  │  │ Lambda 2 │  │                                 │
│  │  │ (redirect│  │                                 │
│  │  └──────────┘  │                                 │
│  └────────────────┘                                 │
└─────────────────────────────────────────────────────┘
```

#### Request Flow During Local Dev

```text
  curl POST http://localhost:3000/shorten
    ↓
  SAM Local API Gateway (port 3000)
    ↓
  Spawns Docker container with CreateUrlFunction
    ↓
  Lambda handler in src/urls/handlers/createUrl.ts
    ↓
  Connects to PostgreSQL at host.docker.internal:5432
    (Docker special hostname to reach host machine)
    ↓
  Returns response to SAM API Gateway
    ↓
  Response sent to curl
```

#### Development Workflow

##### Making Code Changes

1. Edit files in `src/`
2. SAM automatically detects changes and rebuilds (~2-3 seconds)
3. Test with curl or your API client
4. View logs in the SAM CLI terminal

##### Modifying Database Schema

1. Edit `prisma/schema.prisma`
2. Create migration: `npm run db:migrate`
3. Restart SAM to pick up changes

##### Changing Lambda Layers

If you modify code in `infra/lambda-layers/`:

1. Rebuild layers: `npm run build:layers`
2. Restart SAM: Stop (Ctrl+C) and `npm run sam:start`

### API Endpoints

#### Create Short URL

```bash
POST http://localhost:3000/shorten
Content-Type: application/json

{
  "longUrl": "https://example.com/very/long/url"
}
```

**Response:**

```json
{
  "shortCode": "aBc123",
  "shortUrl": "http://localhost:3000/aBc123"
}
```

#### Redirect to Original URL

```bash
GET http://localhost:3000/{code}
```

Redirects (302) to the original long URL.

## Architecture

### URL Encoding Pipeline

1. **Snowflake ID Generation**: Generates a unique 64-bit ID
2. **Feistel Network**: Permutes the ID to hide sequential patterns
3. **Base58 Encoding**: Converts to a 6-character short code

This approach guarantees:

- No collisions (each ID is unique)
- Non-sequential codes (Feistel cipher randomizes)
- Short, URL-safe codes (Base58 encoding)

### Tech Stack

**Backend**:

- AWS Lambda (Node.js 20)
- API Gateway (REST API)
- PostgreSQL 15 (RDS)
- Redis (ElastiCache)

**Infrastructure**:

- AWS CDK (TypeScript)
- Lambda Layers (Snowflake, Encoding)

**Development**:

- AWS SAM CLI (local Lambda emulation)
- Docker Compose (PostgreSQL + Redis)
- Prisma (database ORM)
- Vitest (testing)

## Deployment

### Deployment Prerequisites

- AWS Account
- AWS CLI configured
- CDK bootstrapped (`cdk bootstrap`)

### Deploy to AWS

```bash
# Build Lambda layers
npm run build:layers

# Deploy infrastructure
cd infra
npx cdk deploy --all
```

This creates:

- VPC with 2 AZs
- RDS PostgreSQL instance
- ElastiCache Redis cluster
- Lambda functions
- API Gateway
- Security groups and IAM roles

### Configuration

Environment variables are managed through:

- **Local**: `env.json` (SAM) or `.env` (Prisma)
- **AWS**: Secrets Manager (credentials) + Lambda environment variables

## Testing

Run tests with Vitest:

```bash
# Run all tests
npm run test

# Run specific test file
npx vitest src/services/encoding/feistelNetwork/feistelNetwork.test.ts
```

## Troubleshooting

### Database Connection Issues

**Error**: `Can't reach database server`

- Check Docker is running: `docker ps`
- Check PostgreSQL is healthy: `docker-compose logs postgres`
- Verify connection string in `env.json` uses `host.docker.internal`

### Lambda Layer Errors

**Error**: `Cannot find module 'snowflake'`

- Build layers: `npm run build:layers`
- Verify output: `ls infra/lambda-layers/*/dist/`

### Port Conflicts

**Error**: `Port 5432 already in use`

- Stop existing PostgreSQL: `brew services stop postgresql`
- Or change port in `docker-compose.yml`
