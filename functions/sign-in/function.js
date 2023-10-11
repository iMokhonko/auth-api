// DynamoDB
const { DynamoDBClient, GetItemCommand } = require('@aws-sdk/client-dynamodb');
const dynamoDbClient = new DynamoDBClient({ region: 'us-east-1' });

// KMS
const { KMSClient, DecryptCommand } = require("@aws-sdk/client-kms");
const kmsClient = new KMSClient({ region: 'us-east-1' });

// Secrets Manager
const { SecretsManagerClient, GetSecretValueCommand } = require("@aws-sdk/client-secrets-manager");
const secretsManagerClient = new SecretsManagerClient({ region: 'us-east-1'});

const jwt = require('jsonwebtoken');

const infrastructure = require('infrastructure.json');

const decryptPassword = async (password) => {
  const decrypted = await kmsClient.send(new DecryptCommand({
    KeyId: infrastructure.kms.kms_key_id,
    CiphertextBlob: Buffer.from(password, 'base64')
  }));

  return Buffer.from(decrypted.Plaintext).toString();
}

const getJwtTokenSecret = async () => {
  const data = await secretsManagerClient.send(
    new GetSecretValueCommand({ 
      SecretId: infrastructure.secrets_manager.secret_name
    })
  );

  return data?.SecretString ?? null;
};

const getUserByLogin = async (login = '') => {
  const user = await dynamoDbClient.send(new GetItemCommand({
    TableName: infrastructure.database.dynamo_db_table_name,
    Key: { 
      login: { 
        S: `${login}`.toLocaleLowerCase() 
      } 
    }
  }));

  return user?.Item ?? null;
};

const createResponse = (statusCode = 200, body = {}, { headers = {} } = {}) => ({
  statusCode,

  ...(body && { body: JSON.stringify(body) }),

  headers: {
    "Content-Type": "application/json",
    ...headers
  }
});

exports.handler = async ({ body = {} } = {}) => {
  try {
    const {
      login = '',
      password = ''
    } = JSON.parse(body) ?? {};
  
    const normalizedLogin = `${login}`.trim();
  
    // validate login
    if(!normalizedLogin) {
      return createResponse(400, { errorMessage: `Login required` });
    }
  
    // validate password
    if(!password) {
      return createResponse(400, { errorMessage: `Password required` });
    }
  
    // validate that user with such login does not exist
    const user = await getUserByLogin(normalizedLogin);

    if(!user) {
      return createResponse(400, { errorMessage: `Invalid login or password` });
    }

    // check password
    const decryptedPassword = await decryptPassword(user.password.S);
    if(decryptedPassword !== password) {
      return createResponse(400, { errorMessage: `Invalid login or password` });
    }

    const jwtSecret = await getJwtTokenSecret();

    return createResponse(200, {
      token: jwt.sign({ login: user.login }, jwtSecret, { expiresIn: '30s' }),
      refreshToken: jwt.sign({ login: user.login }, jwtSecret, { expiresIn: '2m' })
    });
  } catch(e) {
    console.error(e);

    return createResponse(500);
  }
}