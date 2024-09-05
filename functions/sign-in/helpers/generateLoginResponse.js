const { env, hostedZone } = require('../env.cligenerated.json');

const jwt = require('jsonwebtoken');

module.exports = async (userId, subscriptionPlan) => {
  // prod env does not appear in url
  const urlEnv = env === 'prod' ? '' : `.${env}`;

  const domain = env
    ? `${urlEnv}.${hostedZone}`
    : `.${hostedZone}`

    return {
      accessToken: {
        value: jwt.sign({ userId, subscriptionPlan, type: 'access_token' }, process.env.JWT_SECRET, { expiresIn: '1h' }),
        maxAge: 3600,
        sameSite: 'lax',
        secure: true,
        domain
      },
      refreshToken: {
        value: jwt.sign({ userId, subscriptionPlan, type: 'refresh_token' }, process.env.JWT_SECRET, { expiresIn: '10d' }),
        maxAge: 864000,
        sameSite: 'lax',
        secure: true,
        domain
      }
    };
}