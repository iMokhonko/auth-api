# Create VPC
resource "aws_vpc" "auth_api_backend_vpc" {
  cidr_block           = "172.16.0.0/16"
  enable_dns_support   = true
  enable_dns_hostnames = true

  tags = {
    Name = "auth-api-backend-vpc"
  }
}

# Create Internet Gateway for VPC
# resource "aws_internet_gateway" "auth_api_internet_gateway" {
#   vpc_id = aws_vpc.auth_api_backend_vpc.id

#   tags = {
#     Name = "auth-api-backend-vpc-ig"
#   }
# }

# Create public subnet in first AZ
# resource "aws_subnet" "auth_api_public_subnet_a" {
#   vpc_id            = aws_vpc.auth_api_backend_vpc.id
#   cidr_block        = "172.16.0.0/24"
#   availability_zone = "eu-central-1a"

#   tags = {
#     Name = "auth-api-public-subnet-a"
#   }
# }

# Create public subnet in second AZ
# resource "aws_subnet" "auth_api_public_subnet_b" {
#   vpc_id            = aws_vpc.auth_api_backend_vpc.id
#   cidr_block        = "172.16.1.0/24"
#   availability_zone = "eu-central-1b"

#   tags = {
#     Name = "auth-api-public-subnet-b"
#   }
# }

# Create private subnet in first AZ
resource "aws_subnet" "auth_api_private_subnet_a" {
  vpc_id            = aws_vpc.auth_api_backend_vpc.id
  cidr_block        = "172.16.2.0/24"
  availability_zone = "eu-central-1a"

  tags = {
    Name = "auth-api-private-subnet-a"
  }
}

# Create private subnet in second AZ
resource "aws_subnet" "auth_api_private_subnet_b" {
  vpc_id            = aws_vpc.auth_api_backend_vpc.id
  cidr_block        = "172.16.3.0/24"
  availability_zone = "eu-central-1b"

  tags = {
    Name = "auth-api-private-subnet-b"
  }
}

# Create route table for public subnets
# It will route all non-local trafic to internet gateway
# resource "aws_route_table" "auth_api_public_subnets_route_table" {
#   vpc_id = aws_vpc.auth_api_backend_vpc.id

#   route {
#     cidr_block = "0.0.0.0/0"
#     gateway_id = aws_internet_gateway.auth_api_internet_gateway.id
#   }

#   tags = {
#     Name = "auth-api-backend-public-subnets-route-table"
#   }
# }

# Assosiate auth_api_public_subnets_route_table with public subnet A
# resource "aws_route_table_association" "auth_api_public_subnet_a_route_table_assosiation" {
#   subnet_id      = aws_subnet.auth_api_public_subnet_a.id
#   route_table_id = aws_route_table.auth_api_public_subnets_route_table.id
# }

# Assosiate auth_api_public_subnets_route_table with public subnet B
# resource "aws_route_table_association" "auth_api_public_subnet_b_route_table_assosiation" {
#   subnet_id      = aws_subnet.auth_api_public_subnet_b.id
#   route_table_id = aws_route_table.auth_api_public_subnets_route_table.id
# }

# Create route table for private subnets
resource "aws_route_table" "auth_api_private_subnets_route_table" {
  vpc_id = aws_vpc.auth_api_backend_vpc.id

  tags = {
    Name = "auth-api-backend-private-subnets-route-table"
  }
}

# Assosiate auth_api_private_subnets_route_table with private subnet B
resource "aws_route_table_association" "auth_api_private_subnet_a_route_table_assosiation" {
  subnet_id      = aws_subnet.auth_api_private_subnet_a.id
  route_table_id = aws_route_table.auth_api_private_subnets_route_table.id
}

# Assosiate auth_api_private_subnets_route_table with private subnet B
resource "aws_route_table_association" "auth_api_private_subnet_b_route_table_assosiation" {
  subnet_id      = aws_subnet.auth_api_private_subnet_b.id
  route_table_id = aws_route_table.auth_api_private_subnets_route_table.id
}

# resource "aws_vpc_endpoint" "secrets_manager_endpoint" {
#   vpc_id            = aws_vpc.auth_api_backend_vpc.id
#   service_name      = "com.amazonaws.eu-central-1.secretsmanager"
#   vpc_endpoint_type = "Interface"

#   security_group_ids = [
#     aws_security_group.vpc_endpoint_sg.id,
#   ]

#   subnet_ids = [
#     aws_subnet.auth_api_private_subnet_a.id,
#     aws_subnet.auth_api_private_subnet_b.id
#   ]

#   private_dns_enabled = true
# }


# Create security group for VPC Endpoints
# resource "aws_security_group" "vpc_endpoint_sg" {
#   name        = "chat-backend-vpc-endpoint-sg"
#   description = "Allow all inbound/outbound traffic"
#   vpc_id      = aws_vpc.auth_api_backend_vpc.id

#   egress {
#     from_port   = 0
#     to_port     = 0
#     protocol    = "-1"
#     cidr_blocks = ["0.0.0.0/0"]
#   }

#   ingress {
#     from_port   = 0
#     to_port     = 0
#     protocol    = "-1"
#     cidr_blocks = ["0.0.0.0/0"]
#   }
# }
