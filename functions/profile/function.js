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
    const { email, firstName, lastName, username } = await getUserById(id);

    if(!username) {
      return createResponse(404, { error: "User does not exist" });
    }

    return createResponse(200, {
      id,
      email,
      firstName,
      lastName,
      username
    });
  } catch (error) {
    console.error(error);

    return createResponse(500, { error: 'Could not retrieve user by ID' });
  }
};