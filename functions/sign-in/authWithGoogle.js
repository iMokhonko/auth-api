const axios = require('axios');
const querystring = require('querystring');
const getUserIdByLogin = require('./helpers/getUserIdByLogin');
const generateLoginReponse = require('./helpers/generateLoginResponse');

const services = require('services.cligenerated.json');
const config = require('config.cligenerated.json');

module.exports = async (event) => {
  const { code } = event?.queryStringParameters ?? {};

  const redirectUrl = `https://${services['auth-api']}/sign-in?type=google`;

  if (code) {
    try {
      const { data: tokens } = await axios.post('https://oauth2.googleapis.com/token', querystring.stringify({
        code,
        client_id: config.google.oauth.clientId,
        client_secret: config.google.oauth.clientSecret,
        redirect_uri: redirectUrl,
        grant_type: 'authorization_code',
      }), {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });
      
      // Fetch the user's profile with the access token
      const { data: profile } = await axios.get('https://www.googleapis.com/oauth2/v2/userinfo', 
        { headers: { Authorization: `Bearer ${tokens.access_token}` } });

      const { email } = profile;

      const userId = await getUserIdByLogin(email, { loginType: 'email' });

      const authStatus = userId ? 'fully_signed_in' : 'provider_signed_in';

      const loginResponse = userId ? await generateLoginReponse(userId) : {};

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
      return {
        statusCode: 500,
        body: JSON.stringify(error.message)
      };
    }
  } else {
    return {
      statusCode: 302,
      headers: {
        Location: `https://accounts.google.com/o/oauth2/v2/auth?client_id=${config.google.oauth.clientId}&redirect_uri=${encodeURIComponent(redirectUrl)}&scope=openid%20email%20profile&response_type=code`,
      }
    };
  }
};