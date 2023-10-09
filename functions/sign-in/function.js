const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB.DocumentClient({ region: 'us-east-1' });
const kms = new AWS.KMS({ region: 'us-east-1' });
const secretsManager = new AWS.SecretsManager({ region: 'us-east-1'});

const jwt = require('jsonwebtoken');

const decryptPassword = async (password) => {
  const decrypted = await kms.decrypt({
    KeyId: 'af536286-f6c0-460c-a365-43d66834f710',
    CiphertextBlob: new Buffer.from(password, 'base64')
  }).promise();

  return decrypted.Plaintext.toString();
}

const getJwtTokenSecret = async (secretId = 'dev/jwt-secret') => {
  const data = await secretsManager.getSecretValue({ SecretId: secretId }).promise();

  return data?.SecretString ?? null;
};

const getUserByLogin = async (login = '') => {
  const user = await dynamodb.get({
    TableName: 'dev-auth-api-users-table',
    Key: { login: `${login}`.toLocaleLowerCase() }
  }).promise();

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
    const decryptedPassword = await decryptPassword(user.password);
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