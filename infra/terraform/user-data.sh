#!/bin/bash
set -e

# Update system
dnf update -y

# Install Docker
dnf install -y docker
systemctl enable docker
systemctl start docker

# Install Docker Compose
curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# Create app directory
mkdir -p /opt/ecommerce
cd /opt/ecommerce

# Create environment file
cat > /opt/ecommerce/.env << 'EOF'
NODE_ENV=production
DATABASE_URL=${database_url}
JWT_SECRET=${jwt_secret}
JWT_ACCESS_EXPIRATION=15m
JWT_REFRESH_EXPIRATION=7d
MERCADO_PAGO_ACCESS_TOKEN=${mercadopago_token}
AWS_REGION=${aws_region}
AWS_S3_BUCKET=${s3_bucket}
RESEND_API_KEY=${resend_api_key}
PORT=3000
EOF

# Copy docker-compose.yml and deploy
# In production, these would be fetched from S3 or CodeDeploy

echo "Deployment complete. Access the app at http://$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4):3000"
