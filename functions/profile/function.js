const infrastructure = require('./infrastructure.cligenerated.json');
const { env, hostedZone } = require('./env.cligenerated.json');

// middlewares
const { compose: composeMiddlewares } = require('@lambda-middleware/compose');
const { cors: corsMiddleware } = require('@lambda-middleware/cors');
const { tokenRateLimiter: tokenRateLimiterMiddleware } = require('@fl13/token-rate-limiter'); // from lambda layer

// helpers
const { createJsonResponse } = require('lambda-nodejs-response-helper');

// actions
const getUserById = require('./getUserById');

const CORS_OPTIONS = {
  allowedMethods: ['GET'],
  allowedOrigins: ['http://localhost:5173', `https://auth.${env}.${hostedZone}`],
  preflightContinue: false,
}

const getMethodHandler = async (event) => {  
  const id = event.pathParameters?.id ?? null;
  
  if(!id) {
    return createJsonResponse(400, { error: "No user ID provided" });  
  }

  try {
    const { email, firstName, lastName, username } = await getUserById(id);

    if(!username) {
      return createJsonResponse(404, { error: "User does not exist" });
    }

    return createJsonResponse(200, {
      id,
      email,
      firstName,
      lastName,
      username
    });
  } catch (error) {
    console.error(error);

    return createJsonResponse(500, { error: 'Could not retrieve user by ID' });
  }
}

exports.handler = async (event, context) => {
  switch (event.httpMethod) {
    case 'OPTIONS': {
      return await composeMiddlewares(
        corsMiddleware(CORS_OPTIONS)
      )(() => {})(event, context) // cors middleware will not execute this logic
    }

    case 'GET': {
      return await composeMiddlewares(
        corsMiddleware(CORS_OPTIONS),
        tokenRateLimiterMiddleware({ 
          rateLimitDynamoDBTableName: infrastructure.featureResources.dynamodb.tableName,
          userId: event?.requestContext?.authorizer?.userId
        })
      )(getMethodHandler)(event, context);
    }

    default: {
      return { statusCode: 501 }
    }
  }
}