const axios = require('axios');
const querystring = require('querystring');
const getUserIdByLogin = require('./helpers/getUserIdByLogin');
const generateLoginReponse = require('./helpers/generateLoginResponse');

const clientId = '252143816418-tir6v1dcpo1l5069eoo9bti4h2lcph2j.apps.googleusercontent.com';
const clientSecret = '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';
const redirectUri = 'https://auth-api.dev.imokhonko.com/sign-in?type=GOOGLE';

module.exports= async (event) => {
  const { code } = event?.queryStringParameters ?? {};

  if (code) {
    try {
      const { data: tokens } = await axios.post('https://oauth2.googleapis.com/token', querystring.stringify({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
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
        Location: `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=openid%20email%20profile&response_type=code`,
      }
    };
  }
};



// const { OAuth2Client } = require('google-auth-library');

// const getUserIdByLogin = require('./helpers/getUserIdByLogin');
// const createResponse = require('./helpers/createResponse');
// const generateLoginReponse = require('./helpers/generateLoginResponse');

// const CLIENT_ID = '252143816418-tir6v1dcpo1l5069eoo9bti4h2lcph2j.apps.googleusercontent.com';

// module.exports = async (googleCredential) => {
//   if(!googleCredential)
//     return createResponse(400, { errorMessage: 'Credential token is required' })

//   const client = new OAuth2Client(CLIENT_ID);

//   const ticket = await client.verifyIdToken({
//     idToken: googleCredential,
//     audience: CLIENT_ID,
//   });

//   const payload = ticket.getPayload();
  
//   const { email } = payload;

//   const userId = await getUserIdByLogin(email, { loginType: 'email' });

//   if(!userId)
//     return createResponse(404, { message: 'User does not exist' });

//   return createResponse(
//     200, 
//     await generateLoginReponse(userId)
//   );
// };
