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

const transformRouteKeyToRateLimitStageVariable = (routeKey) => {
  return 'RATE_LIMIT_' + routeKey
    .replace(/[\/{}\- ]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '')
    .toUpperCase()
}

const transformUnitToTTL = (unit) => {
  switch(unit) {
    case 'second': return 1;
    case 'minute': return 60;
    case 'hour': return 60 * 60
    case 'day': return 60 * 60 * 24;
    default: return 60; // default is per minute
  }
}

exports.handler = async (event) => {
  if (!redisClient.isReady) {
    await redisClient.connect();
  }

  const { sourceIp } = event.requestContext?.http ?? {};

  if(!sourceIp) {
    return generatePolicy('Deny')
  }

  const routeRateLimitRuleName = transformRouteKeyToRateLimitStageVariable(event.routeKey);

  const routeRateLimitRule = event.stageVariables[routeRateLimitRuleName] 
    ?? event.stageVariables.RATE_LIMIT_DEFAULT
    ?? '10/minute';

  // 1/minute -> [1, 'minute'] or 10/hour - > [10, hour]
  const [ruleLimiString, ruleUnit] = routeRateLimitRule.split('/');

  const ruleLimit = Number(ruleLimiString);

  const redisRateLimitKey = `${routeRateLimitRuleName}:${sourceIp}`;
  const redisRateLimitValue = await redisClient.get(redisRateLimitKey);

  if(redisRateLimitValue === null || redisRateLimitValue < 0) {
    // Deny request if rate limit is lower than 1
    if(ruleLimit < 1) {
      return generatePolicy('Deny');
    }

    const ruleTTL = transformUnitToTTL(ruleUnit); // hour -> 60 * 60

    await redisClient.set(redisRateLimitKey, ruleLimit - 1, { EX: ruleTTL });

    return generatePolicy('Allow', { test: 'set' })
  } else {
    // rate limit exceeded
    if(redisRateLimitValue < 1) {
      return generatePolicy('Deny')
    } else {
      // decrement rate limit value by one and allow request
      redisClient.decrBy(redisRateLimitKey, 1);

      return generatePolicy('Allow', { test: 'decr' })
    }
  }
}