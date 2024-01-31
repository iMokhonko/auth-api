const { env, hostedZone } = require('../env.cligenerated.json');

const getJwtSecret = require('./getJwtSecret');
const jwt = require('jsonwebtoken');

module.exports = async (userId) => {
  const jwtSecret = await getJwtSecret();

  // prod env does not appear in url
  const urlEnv = env === 'prod' ? '' : env;

  const domain = env
    ? `.${urlEnv}.${hostedZone}`
    : `.${hostedZone}`

    return {
      accessToken: {
        value: jwt.sign({ userId, type: 'access_token' }, jwtSecret, { expiresIn: '5m' }),
        maxAge: 60 * 5,
        sameSite: 'lax',
        secure: true,
        domain
      },
      refreshToken: {
        value: jwt.sign({ userId, type: 'refresh_token' }, jwtSecret, { expiresIn: '10d' }),
        maxAge: 864000,
        sameSite: 'lax',
        secure: true,
        domain
      }
    };
}