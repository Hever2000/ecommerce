variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "Environment (dev/staging/prod)"
  type        = string
  default     = "dev"
}

variable "ec2_ami" {
  description = "EC2 AMI ID (Amazon Linux 2023)"
  type        = string
  default     = "ami-0c02fb55956c7d316"
}

variable "ec2_instance_type" {
  description = "EC2 instance type (t2.micro for Free Tier)"
  type        = string
  default     = "t2.micro"
}

variable "ec2_key_name" {
  description = "EC2 key pair name for SSH access"
  type        = string
}

variable "allowed_ssh_cidrs" {
  description = "CIDR blocks allowed for SSH access"
  type        = list(string)
  default     = ["0.0.0.0/0"]
}

variable "jwt_secret" {
  description = "JWT secret key"
  type        = string
  sensitive   = true
}

variable "mercadopago_access_token" {
  description = "Mercado Pago access token"
  type        = string
  sensitive   = true
}

variable "resend_api_key" {
  description = "Resend API key"
  type        = string
  sensitive   = true
}
