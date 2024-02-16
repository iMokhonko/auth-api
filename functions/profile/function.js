// Load the AWS SDK
const AWS = require('aws-sdk');

// Create the DynamoDB service object
const ddb = new AWS.DynamoDB.DocumentClient({apiVersion: '2012-08-10'});

const getUserById = require('./getUserById');

const createResponse = (statusCode = 200, body = {}, { headers = {} } = {}) => ({
  statusCode,
  ...(body && { body: JSON.stringify(body) }),
  headers: {
    "Content-Type": "application/json",
    ...headers
  }
});

exports.handler = async (event) => {
  const id = event.pathParameters?.id ?? null;
  
  if(!id) {
    return createResponse(400, { error: "No user ID provided" });  
  }

  try {
    const user = await getUserById(id);

    if(!user) {
      return createResponse(404, { error: "User does not exist" });
    }

    return createResponse(200, {
      id,
      email: user.email.S,
      firstName: user.firstName.S,
      lastName: user.lastName.S,
      username: user.username.S
    });
  } catch (error) {
    console.error(error);

    return createResponse(500, { error: 'Could not retrieve user by ID' });
  }
};