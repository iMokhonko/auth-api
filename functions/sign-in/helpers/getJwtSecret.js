const AWS = require('aws-sdk');
const secretsManagerClient = new AWS.SecretsManager();

const infrastructure = require('../infrastructure.cligenerated.json');

let cachedJwtSecret = null;

module.exports = async () => {
  console.log('cachedJwtSecret', cachedJwtSecret)

  if(cachedJwtSecret) 
    return cachedJwtSecret;

  const secretData = await secretsManagerClient.getSecretValue({ 
    SecretId: infrastructure.secrets_manager.secret_id
  }).promise();
  
  const secret =  secretData?.SecretString ?? Buffer.from(secretData.SecretBinary, 'base64').toString('ascii');

  cachedJwtSecret = secret;

  return secret;
};