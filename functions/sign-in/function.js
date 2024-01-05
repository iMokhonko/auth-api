// DynamoDB
const { DynamoDBClient, GetItemCommand } = require('@aws-sdk/client-dynamodb');
const dynamoDbClient = new DynamoDBClient({ region: 'us-east-1' });

// KMS
const { KMSClient, DecryptCommand } = require("@aws-sdk/client-kms");
const kmsClient = new KMSClient({ region: 'us-east-1' });

const jwt = require('jsonwebtoken');

const infrastructure = require('infrastructure.cligenerated.json');

const { jwtSecretBase64Encoded } = require('./jwt-secret.cligenerated.json');
const decodedJwtSecret = Buffer.from(jwtSecretBase64Encoded, 'base64').toString('utf8');

const decryptPassword = async (password) => {
  return password;
  
}

const createResponse = (statusCode = 200, body = {}, { headers = {} } = {}) => ({
  statusCode,

  ...(body && { body: JSON.stringify(body) }),

  headers: {
    "Content-Type": "application/json",
    ...headers
  }
});

const getUserIdByLogin = async (login = '') => {
  const getUserByLogin = dynamoDbClient.send(new GetItemCommand({
    TableName: infrastructure.database.dynamo_db_table_name,
    Key: { 
      pk: { S: `USER#LOGIN#${login?.toLocaleLowerCase?.()}#` },
      sk: { S: `USER#LOGIN#${login?.toLocaleLowerCase?.()}#` } 
    }
  }));

  const getUserByEmail = dynamoDbClient.send(new GetItemCommand({
    TableName: infrastructure.database.dynamo_db_table_name,
    Key: { 
      pk: { S: `USER#EMAIL#${login}#` },
      sk: { S: `USER#EMAIL#${login}#` } 
    }
  }));

  const [
    userByLogin,
    userByEmail
  ] = await Promise.all([ // TODO refactor to allSettled
    getUserByLogin,
    getUserByEmail
  ]);

  return userByLogin?.Item?.userId?.S ?? userByEmail?.Item?.userId?.S ?? null;
};

const getUserById = async (userId = null) => {
  const user = await dynamoDbClient.send(new GetItemCommand({
    TableName: infrastructure.database.dynamo_db_table_name,
    Key: { 
      pk: { S: `USER#ID#${userId}#` },
      sk: { S: `USER#ID#${userId}#` } 
    }
  }));

  return user?.Item ?? null;
}

exports.handler = async ({ body = {} } = {}) => {
  console.log('decodedJwtSecret', decodedJwtSecret);

  try {
    const {
      login = '',
      password = ''
    } = JSON.parse(body) ?? {};
  
    const normalizedLogin = login?.trim?.();
  
    if(!normalizedLogin) return createResponse(400, { errorMessage: `Login required` });
    if(!password) return createResponse(400, { errorMessage: `Password required` });
  
    const userId = await getUserIdByLogin(normalizedLogin);

    if(!userId) return createResponse(401, { errorMessage: `Invalid login or password` });

    const user = await getUserById(userId);

    if(!user) return createResponse(401, { errorMessage: `Invalid login or password` });

    // check password
    const decryptedPassword = await decryptPassword(user.password.S);
    if(decryptedPassword !== password) return createResponse(401, { errorMessage: `Invalid login or password` });

    // prod env does not appear in url
    const env = infrastructure.__meta.config.env === 'prod' ? '' : infrastructure.__meta.config.env;

    const domain = env
      ? `.${env}.${infrastructure.__meta.config.hostedZone}`
      : `.${infrastructure.__meta.config.hostedZone}`

    return createResponse(200, {
      message: `Successfuly logged in as ${user.login.S}`,
      accessToken: {
        value: jwt.sign({ userId, type: 'access_token' }, decodedJwtSecret, { expiresIn: '5m' }),
        maxAge: 60 * 5,
        sameSite: 'lax',
        secure: true,
        domain
      },
      refreshToken: {
        value: jwt.sign({ userId, type: 'refresh_token' }, decodedJwtSecret, { expiresIn: '10d' }),
        maxAge: 864000,
        sameSite: 'lax',
        secure: true,
        domain
      }
    });
  } catch(e) {
    console.error(e);

    return createResponse(500);
  }
}