const { OAuth2Client } = require('google-auth-library');

const getUserIdByLogin = require('./helpers/getUserIdByLogin');
const createResponse = require('./helpers/createResponse');
const generateLoginReponse = require('./helpers/generateLoginResponse');

const CLIENT_ID = '252143816418-tir6v1dcpo1l5069eoo9bti4h2lcph2j.apps.googleusercontent.com';

module.exports = async (googleCredential) => {
  if(!googleCredential)
    return createResponse(400, { errorMessage: 'Credential token is required' })

  const client = new OAuth2Client(CLIENT_ID);

  const ticket = await client.verifyIdToken({
    idToken: googleCredential,
    audience: CLIENT_ID,
  });

  const payload = ticket.getPayload();
  
  const { email } = payload;

  const userId = await getUserIdByLogin(email, { loginType: 'email' });

  if(!userId)
    return createResponse(404, { message: 'User does not exist' });

  return createResponse(
    200, 
    await generateLoginReponse(userId)
  );
};