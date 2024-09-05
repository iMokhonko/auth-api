const { compose } = require('@lambda-middleware/compose');
const { cors } = require('@lambda-middleware/cors');

const createResponse = require('./helpers/createResponse');
const authWithCredentials = require('./authWithCredentials');
const authWithGoogle = require('./authWithGoogle');
const authWithRefreshToken = require('./authWithRefreshToken.js');

const { env, hostedZone } = require('./env.cligenerated.json');

exports.handler = compose(
  cors({ 
    allowedMethods: ['GET', 'POST'], 
    allowedOrigins: ['http://localhost:5173', `https://auth.${env}.${hostedZone}`]
  })
)(async (event = {}) => {    
  try {    
    const { type } = event?.queryStringParameters ?? {};

    const { body } = event;
    const parsedBody = JSON.parse(body) ?? {};

    switch(type) {
      case 'google': {        
        return await authWithGoogle(event);
      }

      case 'credentials': {
        const { 
          login = null, 
          password = null 
        } = parsedBody;

        return await authWithCredentials(login, password);
      }

      case 'refresh_token': {
        const { refreshToken = null } = parsedBody;

        return await authWithRefreshToken(refreshToken);
      }

      default: {
        return createResponse(400, { errorMessage: `Unsupported auth type` });
      }
    }
  } catch(e) {
    console.error(e);

    return createResponse(500);
  }
});