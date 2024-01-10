const AWS = require('aws-sdk');

// secrets manager
const secretsManagerClient = new AWS.SecretsManager();

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

let cachedJwtSecret = null;
const getJwtSecret = async () => {
  if(cachedJwtSecret) return cachedJwtSecret;

  try {
    const secretData = await secretsManagerClient.getSecretValue({ 
      SecretId: infrastructure.secrets_manager.secret_id
    }).promise();
    
    const secret =  secretData?.SecretString ?? Buffer.from(secretData.SecretBinary, 'base64').toString('ascii');

    cachedJwtSecret = secret;

    return secret;
  } catch (err) {
    console.error(e)
    
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