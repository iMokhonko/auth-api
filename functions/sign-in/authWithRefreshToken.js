

const createResponse = require('./helpers/createResponse');
const verifyJwtToken = require('./helpers/verifyJwtToken');
const generateLoginReponse = require('./helpers/generateLoginResponse');

module.exports = async (refreshToken) => {
  if(!refreshToken)
    return createResponse(400, { errorMessage: 'Refresh token is required' })

  const { 
    isValid = false,
    decoded = null 
  } = verifyJwtToken(refreshToken, process.env.JWT_SECRET);

  if(!isValid || decoded.type !== 'refresh_token')
    return createResponse(401, { errorMessage: 'Invalid refresh token' });

  return createResponse(
    200, 
    await generateLoginReponse(decoded.userId, decoded.subscriptionPlan)
  );
};