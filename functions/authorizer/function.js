const jwt = require('jsonwebtoken');
const { createClient } = require('redis')

const infrastructure = require('./infrastructure.cligenerated.json');

const redisEnpoint = infrastructure.globalResources.elasticache.endpoint[0].address;
const redisPort = infrastructure.globalResources.elasticache.endpoint[0].port;
const redisClient = createClient({ 
  url: `rediss://${redisEnpoint}:${redisPort}`,
  tls: true
});

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
    console.log('event', JSON.stringify(event));

  if (!redisClient.isReady) {
    await redisClient.connect();
  }

  await redisClient.set('my_key', 'MY_VALUE');
  const value = await redisClient.get('my_key');
  console.log('value from redis cache', value);

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
    console.log("Could not verify token: ", err);

    return generatePolicy('Deny');
  }
}