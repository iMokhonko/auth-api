const createResponse = require('./helpers/createResponse');
const authWithCredentials = require('./authWithCredentials');
const authWithGoogle = require('./authWithGoogle');
const refreshTokens = require('./refreshTokens');

exports.handler = async ({ body = {} } = {}) => {
  try {
    const parsedBody = JSON.parse(body) ?? {};

    const { authType = null } = parsedBody;

    switch(authType) {
      case 'GOOGLE': {
        const { googleCredential = null } = parsedBody;
        
        return await authWithGoogle(googleCredential);
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