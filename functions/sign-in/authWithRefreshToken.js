

const createResponse = require('./helpers/createResponse');
const verifyJwtToken = require('./helpers/verifyJwtToken');
const getJwtSecret = require('./helpers/getJwtSecret');
const generateLoginReponse = require('./helpers/generateLoginResponse');

module.exports = async (refreshToken) => {
  if(!refreshToken)
    return createResponse(400, { errorMessage: 'Refresh token is required' })

  const jwtSecret = await getJwtSecret();

  const { 
    isValid = false,
    decoded = null 
  } = verifyJwtToken(refreshToken, jwtSecret);

  if(!isValid || decoded.type !== 'refresh_token')
    return createResponse(401, { errorMessage: 'Invalid refresh token' });

  return createResponse(
    200, 
    await generateLoginReponse(decoded.userId, decoded.subscriptionPlan)
  );
};