const jwt = require('jsonwebtoken');

const { jwtSecretBase64Encoded } = require('./jwt-secret.cligenerated.json');
const decodedJwtSecret = Buffer.from(jwtSecretBase64Encoded, 'base64').toString('utf8');

const generatePolicy = (effect = 'Deny', context = {}) => {
  return {
    principalId: 'user',
    policyDocument: {
      Version: '2012-10-17',
      Statement: [
        {
          Action: 'execute-api:Invoke',
          Effect: effect,
          Resource: "*",
        },
      ],
    },
    context
  };
};

exports.handler = async (event) => {
  const [tokenType, token] = `${event.identitySource[0]}`.split(' ');

  if(!tokenType || !token || tokenType !== 'Bearer') {
    return generatePolicy('Deny');
  }

  try {
    const decoded = jwt.verify(token, decodedJwtSecret);

    if(!decoded.type || decoded.type !== 'access_token') {
      return generatePolicy('Deny');
    }

    return generatePolicy('Allow', decoded);
  } catch (err) {
    console.log("Could not verify token: ", err);

    return generatePolicy('Deny');
  }
}