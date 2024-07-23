const { SecretsManagerClient, GetSecretValueCommand } = require("@aws-sdk/client-secrets-manager");
const secretsManagerClient = new SecretsManagerClient({ region: 'us-east-1' });

const infrastructure = require('../infrastructure.cligenerated.json');

let cachedJwtSecret = null;

module.exports = async () => {
  if(cachedJwtSecret) 
    return cachedJwtSecret;

  const command = new GetSecretValueCommand({ SecretId: infrastructure.globalResources.secretsManager.secretId });
  
  const { SecretString: secret } = await secretsManagerClient.send(command);

  cachedJwtSecret = secret;

  return secret;
};