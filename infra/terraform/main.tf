terraform {
  required_version = ">= 1.6.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

# ============================================================
# SECRETS MANAGER
# ============================================================
resource "aws_secretsmanager_secret" "app_secrets" {
  name        = "ecommerce-${var.environment}-secrets"
  description = "Ecommerce application secrets"

  rotation_rules {
    automatically_after_days = 90
  }

  tags = {
    Name        = "ecommerce-secrets"
    Environment = var.environment
  }
}

resource "aws_secretsmanager_secret_version" "app_secrets_value" {
  secret_id = aws_secretsmanager_secret.app_secrets.id
  secret_string = jsonencode({
    JWT_SECRET              = var.jwt_secret
    MERCADO_PAGO_ACCESS_TOKEN = var.mercadopago_access_token
    RESEND_API_KEY          = var.resend_api_key
  })
}

# ============================================================
# S3 BUCKET FOR PRODUCT IMAGES
# ============================================================
resource "aws_s3_bucket" "products" {
  bucket        = "ecommerce-${var.environment}-products-${data.aws_caller_identity.current.account_id}"
  force_destroy = true

  tags = {
    Name        = "Ecommerce Products"
    Environment = var.environment
  }
}

resource "aws_s3_bucket_public_access_block" "products" {
  bucket = aws_s3_bucket.products.id

  block_public_acls       = false
  block_public_policy     = false
  ignore_public_acls      = false
  restrict_public_buckets = false
}

resource "aws_s3_bucket_policy" "products_public" {
  bucket = aws_s3_bucket.products.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "PublicReadGetObject"
        Effect    = "Allow"
        Principal = "*"
        Action    = "s3:GetObject"
        Resource  = "${aws_s3_bucket.products.arn}/*"
      },
    ]
  })
}

resource "aws_s3_bucket_cors_configuration" "products" {
  bucket = aws_s3_bucket.products.id

  cors_rule {
    allowed_headers = ["*"]
    allowed_methods = ["GET", "PUT", "POST", "DELETE"]
    allowed_origins = ["*"]
    expose_headers  = ["ETag"]
    max_age_seconds = 3600
  }
}

# ============================================================
# CLOUDFRONT FOR S3
# ============================================================
resource "aws_cloudfront_origin_access_control" "s3" {
  name                              = "ecommerce-${var.environment}-s3-oac"
  description                       = "OAC for S3 bucket"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

resource "aws_cloudfront_distribution" "cdn" {
  enabled             = true
  is_ipv6_enabled     = true
  default_root_object = "index.html"
  price_class         = "PriceClass_100"

  origin {
    domain_name              = aws_s3_bucket.products.bucket_regional_domain_name
    origin_id                = "S3-${aws_s3_bucket.products.id}"
    origin_access_control_id = aws_cloudfront_origin_access_control.s3.id
  }

  default_cache_behavior {
    allowed_methods        = ["GET", "HEAD", "OPTIONS"]
    cached_methods         = ["GET", "HEAD"]
    target_origin_id       = "S3-${aws_s3_bucket.products.id}"
    viewer_protocol_policy = "redirect-to-https"
    compress               = true

    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }

    min_ttl     = 0
    default_ttl = 3600
    max_ttl     = 86400
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    cloudfront_default_certificate = true
    minimum_protocol_version       = "TLSv1.2_2021"
  }

  tags = {
    Name        = "ecommerce-cdn"
    Environment = var.environment
  }
}

# ============================================================
# EC2 INSTANCE
# ============================================================
resource "aws_security_group" "ec2" {
  name        = "ecommerce-${var.environment}-sg"
  description = "Security group for ecommerce EC2"

  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = var.allowed_ssh_cidrs
  }

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    from_port   = 3000
    to_port     = 3000
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    from_port   = 3001
    to_port     = 3001
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name        = "ecommerce-sg"
    Environment = var.environment
  }
}

resource "aws_instance" "app" {
  ami                    = var.ec2_ami
  instance_type          = var.ec2_instance_type
  vpc_security_group_ids = [aws_security_group.ec2.id]
  key_name               = var.ec2_key_name

  user_data = templatefile("${path.module}/user-data.sh", {
    environment   = var.environment
    cloudfront_id = aws_cloudfront_distribution.cdn.id
    s3_bucket     = aws_s3_bucket.products.id
    secrets_arn   = aws_secretsmanager_secret.app_secrets.arn
  })

  root_block_device {
    volume_size = 20
    volume_type = "gp3"
    encrypted   = true
  }

  tags = {
    Name        = "ecommerce-${var.environment}"
    Environment = var.environment
  }
}

# ============================================================
# CLOUDWATCH
# ============================================================
resource "aws_cloudwatch_log_group" "app" {
  name              = "/ecommerce/${var.environment}"
  retention_in_days = 30

  tags = {
    Name        = "ecommerce-logs"
    Environment = var.environment
  }
}

resource "aws_cloudwatch_metric_alarm" "high_cpu" {
  alarm_name          = "ecommerce-${var.environment}-high-cpu"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "CPUUtilization"
  namespace           = "AWS/EC2"
  period              = 300
  statistic           = "Average"
  threshold           = 80
  alarm_description   = "This metric monitors ec2 cpu utilization"
  insufficient_data_actions = []

  dimensions = {
    InstanceId = aws_instance.app.id
  }
}

# ============================================================
# DATA SOURCES
# ============================================================
data "aws_caller_identity" "current" {}

# ============================================================
# OUTPUTS
# ============================================================
output "ec2_public_ip" {
  value = aws_instance.app.public_ip
}

output "ec2_public_dns" {
  value = aws_instance.app.public_dns
}

output "s3_bucket" {
  value = aws_s3_bucket.products.id
}

output "cloudfront_domain" {
  value = aws_cloudfront_distribution.cdn.domain_name
}

output "cloudfront_id" {
  value = aws_cloudfront_distribution.cdn.id
}

output "secrets_arn" {
  value = aws_secretsmanager_secret.app_secrets.arn
}

output "cloudwatch_log_group" {
  value = aws_cloudwatch_log_group.app.name
}
