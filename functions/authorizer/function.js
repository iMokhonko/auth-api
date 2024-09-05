const jwt = require('jsonwebtoken');

const generatePolicy = (effect = 'Deny', resource, context = {}) => {
  return {
    principalId: context?.userId ?? 'user',
    policyDocument: {
      Version: '2012-10-17',
      Statement: [
        {
          Action: 'execute-api:Invoke',
          Effect: effect,
          Resource: resource,
        },
      ],
    },
    context
  };
};

exports.handler = async (event) => {
  console.log('event', JSON.stringify(event));

  const [tokenType, token] = `${event.authorizationToken}`.split(' ');

  if(!tokenType || !token || tokenType !== 'Bearer') {
    return generatePolicy('Deny', event.methodArn);
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if(!decoded.type || decoded.type !== 'access_token') {
      return generatePolicy('Deny', event.methodArn);
    }

    console.log('ALLOW', decoded)
    return generatePolicy('Allow', event.methodArn, decoded);
  } catch (err) {
    return generatePolicy('Deny', event.methodArn);
  }
}