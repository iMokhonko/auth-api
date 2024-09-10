# Create REST API
resource "aws_api_gateway_rest_api" "rest_api" {
  name = "${var.env}-${var.feature}-auth-rest-api"

  body = jsonencode({
    openapi = "3.0.0"
    info = {
      title   = "${var.env}-${var.feature}-auth-rest-api"
      version = "1.0"
    }

    components = {
      securitySchemes = {
        lambda-authorizer = {
          type                         = "apiKey"
          name                         = "Authorization"
          in                           = "header"
          identitySource               = "method.request.header.Authorization"
          enableSimpleResponses        = false
          x-amazon-apigateway-authtype = "custom"
          x-amazon-apigateway-authorizer = {
            type                         = "token"
            authorizerUri                = aws_lambda_function.authorizer_lambda.invoke_arn
            authorizerResultTtlInSeconds = 10
          }
        }
      }
    }

    paths = {
      "/sign-up" = {
        post = {
          x-amazon-apigateway-integration = {
            httpMethod           = "POST"
            payloadFormatVersion = "1.0"
            type                 = "AWS_PROXY"
            uri                  = aws_lambda_function.sign_up_lambda.invoke_arn
          }
        }
      }

      "/sign-in" = {
        get = {
          x-amazon-apigateway-integration = {
            httpMethod           = "POST"
            payloadFormatVersion = "1.0"
            type                 = "AWS_PROXY"
            uri                  = aws_lambda_function.sign_in_lambda.invoke_arn
          }
        }

        post = {
          x-amazon-apigateway-integration = {
            httpMethod           = "POST"
            payloadFormatVersion = "1.0"
            type                 = "AWS_PROXY"
            uri                  = aws_lambda_function.sign_in_lambda.invoke_arn
          }
        }
      }

      "/reset-password" = {
        post = {
          x-amazon-apigateway-integration = {
            httpMethod           = "POST"
            payloadFormatVersion = "1.0"
            type                 = "AWS_PROXY"
            uri                  = aws_lambda_function.reset_password_lambda.invoke_arn
          }
        }
      }

      "/verify" = {
        get = {
          x-amazon-apigateway-integration = {
            httpMethod           = "POST"
            payloadFormatVersion = "1.0"
            type                 = "AWS_PROXY"
            uri                  = aws_lambda_function.verify_user_lambda.invoke_arn
          }
        }
      }

      "/profile/{id}" = {
        get = {
          x-amazon-apigateway-integration = {
            httpMethod           = "POST"
            payloadFormatVersion = "1.0"
            type                 = "AWS_PROXY"
            uri                  = aws_lambda_function.profile_lambda.invoke_arn
          }

          security = [{ lambda-authorizer = [] }],
        }

        options = {
          x-amazon-apigateway-integration = {
            httpMethod           = "POST"
            payloadFormatVersion = "1.0"
            type                 = "AWS_PROXY"
            uri                  = aws_lambda_function.profile_lambda.invoke_arn
          }
        }
      }
    }

    x-amazon-apigateway-gateway-responses = {
      ACCESS_DENIED = {
        statusCode = 403
        responseParameters = {
          "gatewayresponse.header.Access-Control-Allow-Origin" = "'*'"
        }

        responseTemplates = {
          "application/json" = "{\"message\":\"Unauthorized\"}"
        }
      }

      MISSING_AUTHENTICATION_TOKEN = {
        statusCode = 403,
        responseParameters = {
          "gatewayresponse.header.Access-Control-Allow-Origin" = "'*'"
        }

        responseTemplates = {
          "application/json" = "{\"message\":\"Missing authentication token or resource may not be  supported\"}"
        }
      }
    }
  })

  endpoint_configuration {
    types = ["REGIONAL"]
  }
}

# Create API Deployment when something changes
resource "aws_api_gateway_deployment" "rest_api_deployment" {
  rest_api_id = aws_api_gateway_rest_api.rest_api.id

  triggers = {
    redeployment = sha1(jsonencode(aws_api_gateway_rest_api.rest_api.body))
  }

  lifecycle {
    create_before_destroy = true
  }
}

# Create default stage for API
resource "aws_api_gateway_stage" "rest_api_master_stage" {
  deployment_id = aws_api_gateway_deployment.rest_api_deployment.id
  rest_api_id   = aws_api_gateway_rest_api.rest_api.id
  stage_name    = "master"
}

# Create custom domain name for API
resource "aws_api_gateway_domain_name" "custom_domain_name" {
  domain_name     = "${var.config.subdomain}.${var.env}.${var.config.hostedZone}"
  certificate_arn = var.global_resources.tls_certificate.arn
  security_policy = "TLS_1_2"
}

# Create Route 53 record for custom domain name
resource "aws_route53_record" "api_route_53_record" {
  name    = aws_api_gateway_domain_name.custom_domain_name.domain_name
  type    = "A"
  zone_id = data.aws_route53_zone.primary.zone_id

  alias {
    name                   = aws_api_gateway_domain_name.custom_domain_name.cloudfront_domain_name
    zone_id                = aws_api_gateway_domain_name.custom_domain_name.cloudfront_zone_id
    evaluate_target_health = false
  }
}

# Map API to custom domain name
resource "aws_api_gateway_base_path_mapping" "rest_api_master_stage_mapping" {
  api_id      = aws_api_gateway_rest_api.rest_api.id
  stage_name  = "master"
  domain_name = aws_api_gateway_domain_name.custom_domain_name.domain_name
}
