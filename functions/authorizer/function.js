const jwt = require('jsonwebtoken');

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
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if(!decoded.type || decoded.type !== 'access_token') {
      return generatePolicy('Deny');
    }

    return generatePolicy('Allow', decoded);
  } catch (err) {
    return generatePolicy('Deny');
  }
}