const createResponse = require('./helpers/createResponse');
const authWithCredentials = require('./authWithCredentials');
const authWithGoogle = require('./authWithGoogle');
const refreshTokens = require('./refreshTokens');

exports.handler = async (event = {}) => {
  try {    
    const { type } = event?.queryStringParameters ?? {};

    const { body } = event;
    const parsedBody = JSON.parse(body) ?? {};

    switch(type) {
      case 'GOOGLE': {        
        return await authWithGoogle(event);
      }

      case 'CREDENTIALS': {
        const { 
          login = null, 
          password = null 
        } = parsedBody;

        return await authWithCredentials(login, password);
      }

      case 'REFRESH_TOKENS': {
        const { refreshToken = null } = parsedBody;

        return await refreshTokens(refreshToken);
      }

      default: {
        return createResponse(400, { errorMessage: `Unsupported auth type` });
      }
    }
  } catch(e) {
    console.error(e);

    return createResponse(500);
  }
}