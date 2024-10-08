const axios = require('axios');
const querystring = require('querystring');
const getUserIdByLogin = require('./helpers/getUserIdByLogin');
const getUserById = require('./helpers/getUserById');
const generateLoginReponse = require('./helpers/generateLoginResponse');

const services = require('services.cligenerated.json');

module.exports = async (event) => {
  const { code } = event?.queryStringParameters ?? {};

  const redirectUrl = `https://${services['auth-api']}/sign-in?type=google`;

  if (code) {
    try {
      console.log('get tokens')
      const { data: tokens } = await axios.post('https://oauth2.googleapis.com/token', querystring.stringify({
        code,
        client_id: process.env.GOOGLE_AUTH_CLIENT_ID,
        client_secret: process.env.GOOGLE_AUTH_CLIENT_SECRET,
        redirect_uri: redirectUrl,
        grant_type: 'authorization_code',
      }), {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      console.log('tokens', tokens);
      
      // Fetch the user's profile with the access token
      const { data: profile } = await axios.get('https://www.googleapis.com/oauth2/v2/userinfo', 
        { headers: { Authorization: `Bearer ${tokens.access_token}` } });

      const { email } = profile;

      const userId = await getUserIdByLogin(email, { loginType: 'email' });
      const user = await getUserById(userId);

      const authStatus = userId ? 'fully_signed_in' : 'provider_signed_in';

      const loginResponse = userId 
        ? await generateLoginReponse(userId, user.subscriptionPlan) 
        : {};

      return {
        statusCode: 200,
        headers: { 'Content-Type': 'text/html' },
        body: `<html>
        <head>
        <script>
          window.opener?.postMessage(JSON.stringify({
            type: "google-auth:success",
            payload: {
              status: '${authStatus}',

              ${authStatus === 'fully_signed_in' ? `
                authDetails: ${JSON.stringify(loginResponse)},
              ` : ''}

              providerData: {
                profile: ${JSON.stringify(profile)},
                accessToken: '${tokens.access_token}'
              }
            }
          }), '*');
        </script>
        </head>
        </html>`,
      };       
    } catch (error) {
      console.error('error', error);
      return {
        statusCode: 500,
        body: JSON.stringify(error.message)
      };
    }
  } else {
    return {
      statusCode: 302,
      headers: {
        Location: `https://accounts.google.com/o/oauth2/v2/auth?client_id=${process.env.GOOGLE_AUTH_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUrl)}&scope=openid%20email%20profile&response_type=code`,
      }
    };
  }
};