const jwt = require('jsonwebtoken');
const infrastructure = require('infrastructure.cligenerated.json');

const { jwtSecretBase64Encoded } = require('./jwt-secret.cligenerated.json');
const decodedJwtSecret = Buffer.from(jwtSecretBase64Encoded, 'base64').toString('utf8');

const createResponse = (statusCode = 200, body = {}, { headers = {} } = {}) => ({
  statusCode,

  ...(body && { body: JSON.stringify(body) }),

  headers: {
    'Content-Type': 'application/json',
    ...headers
  }
});

const verifyJwtToken = (token = '', secretKey = '') => {
  try {
    if(!token || !secretKey) {
      return {
        isValid: false
      };
    }

    const decoded = jwt.verify(token, secretKey);

    return {
      isValid: true,
      decoded
    };
  } catch (err) {
    return {
      isValid: false
    };
  }
};

exports.handler = async ({ body = {} } = {}) => {
  try {
    const {
      refreshToken = '',
    } = JSON.parse(body) ?? {};
    
    const { 
      isValid = false, 
      decoded = null 
    } = verifyJwtToken(refreshToken, decodedJwtSecret);

    if(!isValid || decoded.type !== 'refresh_token') {
      return createResponse(401, { errorMessage: 'Invalid refresh token' });
    }

    // prod env does not appear in url
    const env = infrastructure.__meta.config.env === 'prod' ? '' : infrastructure.__meta.config.env;

    const domain = env 
      ? `.${env}.${infrastructure.__meta.config.hostedZone}`
      : `.${infrastructure.__meta.config.hostedZone}`

    return createResponse(200, {
      accessToken: {
        value: jwt.sign({ userId: decoded.userId, type: 'access_token' }, decodedJwtSecret, { expiresIn: '5m' }),
        maxAge: 60 * 5,
        sameSite: 'lax',
        secure: true,
        domain
      },
      refreshToken: {
        value: jwt.sign({ userId: decoded.userId, type: 'refresh_token' }, decodedJwtSecret, { expiresIn: '10d' }),
        maxAge: 864000,
        sameSite: 'lax',
        secure: true,
        domain
      }
    });
  } catch(e) {
    console.error(e);

    return createResponse(500,  { errorMessage: 'Something went wrong, please try again later' });
  }
}