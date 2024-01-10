const infrastructure = require('../infrastructure.cligenerated.json');
const getJwtSecret = require('./getJwtSecret');
const jwt = require('jsonwebtoken');

module.exports = async (userId) => {
  const jwtSecret = await getJwtSecret();

  // prod env does not appear in url
  const env = infrastructure.__meta.config.env === 'prod' ? '' : infrastructure.__meta.config.env;

  const domain = env
    ? `.${env}.${infrastructure.__meta.config.hostedZone}`
    : `.${infrastructure.__meta.config.hostedZone}`

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