const { SecretsManagerClient, GetSecretValueCommand } = require("@aws-sdk/client-secrets-manager");

const jwt = require('jsonwebtoken');

const infrastructure = require('infrastructure.cligenerated.json');

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

let cachedJwtSecret = null;
const getJwtSecret = async () => {
  if(cachedJwtSecret) return cachedJwtSecret;

  const secretsManagerClient = new SecretsManagerClient({ region: 'us-east-1' });
  const command = new GetSecretValueCommand({
    SecretId: infrastructure.globalResources.secretsManager.secretId
  });

  try {
    const { SecretString: secret } = await secretsManagerClient.send(command);

    cachedJwtSecret = secret;

    return secret;
  } catch (err) {
    console.error(err)
    
    return null;
  }
};

exports.handler = async (event) => {
  const [tokenType, token] = `${event.identitySource[0]}`.split(' ');

  if(!tokenType || !token || tokenType !== 'Bearer') {
    return generatePolicy('Deny');
  }

  const jwtSecret = await getJwtSecret();

  try {
    const decoded = jwt.verify(token, jwtSecret);

    if(!decoded.type || decoded.type !== 'access_token') {
      return generatePolicy('Deny');
    }

    return generatePolicy('Allow', decoded);
  } catch (err) {
    console.log("Could not verify token: ", err);

    return generatePolicy('Deny');
  }
}