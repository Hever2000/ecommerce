# Deployment Guide

## Local Development

### Prerequisites

- Node.js 20+
- npm 10+
- Docker & Docker Compose (optional)
- Supabase account (or local PostgreSQL)
- AWS account (for S3/CloudFront — optional in dev)

### 1. Clone and install

```bash
git clone https://github.com/your-org/ecommerce-aws
cd ecommerce-aws

# Backend
cd backend
cp .env.example .env
npm install
npx prisma generate
npx prisma migrate dev
npm run prisma:seed
npm run start:dev

# Frontend (separate terminal)
cd frontend
cp .env.example .env.local
npm install
npm run dev
```

### 2. Environment variables

**Backend** (`backend/.env`):

```env
NODE_ENV=development
PORT=3000
DATABASE_URL=postgresql://postgres:password@localhost:5432/ecommerce?schema=public
JWT_SECRET=your-secret-key-change-in-production
JWT_ACCESS_EXPIRATION=15m
JWT_REFRESH_EXPIRATION=7d
MERCADO_PAGO_ACCESS_TOKEN=your-mp-token
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-aws-key
AWS_SECRET_ACCESS_KEY=your-aws-secret
AWS_S3_BUCKET=ecommerce-aws-products
RESEND_API_KEY=re_xxx
RESEND_FROM_EMAIL=noreply@ecommerce.com
CORS_ORIGIN=http://localhost:3001
```

**Frontend** (`frontend/.env.local`):

```env
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id
```

---

## Docker Compose (Local)

```bash
docker compose up --build
```

This starts:

- **Backend** on port `3000` (with healthcheck: GET /health)
- **Frontend** on port `3001` (waits for backend healthy)

Both containers run in bridge network `ecommerce-network`.

### Healthcheck

Docker Compose waits for the backend to pass its healthcheck before starting the frontend:

```yaml
healthcheck:
  test: ['CMD', 'curl', '-f', 'http://localhost:3000/health']
  interval: 30s
  timeout: 10s
  retries: 3
  start_period: 10s
```

---

## AWS Infrastructure (Terraform)

### Architecture

```
Route53 -> EC2 (Docker Compose) + CloudFront (S3 images)
```

### Terraform resources (`infra/terraform/`)

| Resource                         | Description                          |
| -------------------------------- | ------------------------------------ |
| `aws_secretsmanager_secret`      | Stores JWT_SECRET, MP token, Resend  |
| `aws_s3_bucket`                  | Product images (public-read)         |
| `aws_cloudfront_distribution`    | CDN for S3 (OAC, HTTPS, compress)    |
| `aws_instance`                   | EC2 t2.micro, Amazon Linux 2023      |
| `aws_security_group`             | Ports 22, 80, 443, 3000, 3001        |
| `aws_cloudwatch_log_group`       | Application logs (30 day retention)  |
| `aws_cloudwatch_metric_alarm`    | CPU > 80% alert                      |

### Deploy

```bash
cd infra/terraform

terraform init
terraform plan \
  -var="ec2_key_name=my-key" \
  -var="jwt_secret=..." \
  -var="mercadopago_access_token=..." \
  -var="resend_api_key=..."

terraform apply
```

Outputs: `ec2_public_ip`, `s3_bucket_name`, `cloudfront_domain`, `secrets_arn`, `cloudwatch_log_group`.

### User Data (`user-data.sh`)

EC2 user-data script installs Docker + Docker Compose on boot, creates the app directory, and writes environment configuration. In production, `.env` and `docker-compose.yml` should be fetched from S3 or Secrets Manager.

---

## Environment Variables Reference

| Variable                     | Required | Description                             |
| ---------------------------- | -------- | --------------------------------------- |
| `NODE_ENV`                   | Yes      | `development`, `production`             |
| `PORT`                       | No       | Backend port (default: 3000)            |
| `DATABASE_URL`               | Yes      | PostgreSQL connection string            |
| `JWT_SECRET`                 | Yes      | Secret for signing JWT tokens           |
| `JWT_ACCESS_EXPIRATION`      | No       | Access token TTL (default: `15m`)       |
| `JWT_REFRESH_EXPIRATION`     | No       | Refresh token TTL (default: `7d`)       |
| `GOOGLE_CLIENT_ID`           | No       | Google OAuth client ID                  |
| `MERCADO_PAGO_ACCESS_TOKEN`  | Yes      | Mercado Pago API access token           |
| `AWS_REGION`                 | Yes      | AWS region (default: `us-east-1`)       |
| `AWS_ACCESS_KEY_ID`          | Yes*     | AWS access key (*if using S3)           |
| `AWS_SECRET_ACCESS_KEY`      | Yes*     | AWS secret key (*if using S3)           |
| `AWS_S3_BUCKET`              | Yes*     | S3 bucket name (*if using S3)           |
| `RESEND_API_KEY`             | Yes*     | Resend API key (*if using email)        |
| `RESEND_FROM_EMAIL`          | No       | Sender email (default: noreply@...)     |
| `CORS_ORIGIN`                | Yes      | Allowed CORS origin (frontend URL)      |

---

## CI/CD Considerations

### Recommended pipeline

1. **Lint & Type Check** — `npm run lint`, `tsc --noEmit`
2. **Unit Tests** — `npm run test`
3. **Build** — `npm run build` (backend), `npm run build` (frontend)
4. **Docker Build** — Build images, push to ECR
5. **Migrate** — `npx prisma migrate deploy` (runs pending migrations)
6. **Deploy** — SSH to EC2, pull images, `docker compose up -d`

### Migration safety

- Migrations run **before** the new application version deploys
- Prisma migrations are backward-compatible (no destructive changes without approval)
- Rollback: deploy previous Docker image + run a down migration if needed

### Secrets in CI

- Use CI/CD secrets (GitHub Actions secrets, GitLab CI variables)
- Terraform variables passed via `-var` or `.tfvars` files (never committed)

---

## Monitoring (CloudWatch)

### Logs

The backend uses Winston with `winston-cloudwatch` transport to stream logs to CloudWatch:

- Log group: `/ecommerce/{environment}`
- Retention: 30 days
- Accessible via AWS Console > CloudWatch > Log Groups

### Metrics & Alarms

| Alarm           | Metric          | Threshold    | Action                     |
| --------------- | --------------- | ------------ | -------------------------- |
| High CPU        | CPUUtilization  | > 80% for 2  | CloudWatch alarm trigger   |

### Healthchecks

Docker Compose runs healthchecks every 30s. Failed healthchecks trigger container restarts (`restart: unless-stopped`).
