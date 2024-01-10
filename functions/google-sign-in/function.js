// Load the AWS SDK
const AWS = require('aws-sdk');

// secrets manager
const secretsManagerClient = new AWS.SecretsManager();

// Create the DynamoDB service object
const ddb = new AWS.DynamoDB.DocumentClient({apiVersion: '2012-08-10'});

const { OAuth2Client } = require('google-auth-library');
const { v4: uuidv4 } = require('uuid');
const jwt = require('jsonwebtoken');

const infrastructure = require('infrastructure.cligenerated.json');

const getUserByEmail = async (email) => {
  const getParams = {
    TableName: infrastructure.database.dynamo_db_table_name,
    Key: {
      'pk': `USER#EMAIL#${email}#`,
      'sk': `USER#EMAIL#${email}#`
    }
  };

  // Using GetItem operation to get a user by Email
  const response = await ddb.get(getParams).promise();

  return response?.Item ?? null;
}

const createResponse = (statusCode = 200, body = {}, { headers = {} } = {}) => ({
  statusCode,

  ...(body && { body: JSON.stringify(body) }),

  headers: {
    "Content-Type": "application/json",
    ...headers
  }
});

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

const CLIENT_ID = '252143816418-tir6v1dcpo1l5069eoo9bti4h2lcph2j.apps.googleusercontent.com';

exports.handler = async ({ body = {} } = {}) => {
  try {
    const {
      credential
    } = JSON.parse(body) ?? {};

    if(!credential) {
      return createResponse(400, { errorMessage: 'Credential token is required' })
    }
  
    const client = new OAuth2Client(CLIENT_ID);
    
    try {
      const ticket = await client.verifyIdToken({
        idToken: credential,
        audience: CLIENT_ID,
      });

      const payload = ticket.getPayload();
      
      const { email } = payload;

      const user = await getUserByEmail(email);

      if(user) {
        const jwtSecret = await getJwtSecret();
        // prod env does not appear in url
        const env = infrastructure.__meta.config.env === 'prod' ? '' : infrastructure.__meta.config.env;

        const domain = env
          ? `.${env}.${infrastructure.__meta.config.hostedZone}`
          : `.${infrastructure.__meta.config.hostedZone}`
          
        return createResponse(200, {
          accessToken: {
            value: jwt.sign({ userId: user?.userId, type: 'access_token' }, jwtSecret, { expiresIn: '5m' }),
            maxAge: 60 * 5,
            sameSite: 'lax',
            secure: true,
            domain
          },
          refreshToken: {
            value: jwt.sign({ userId: user?.userId, type: 'refresh_token' }, jwtSecret, { expiresIn: '10d' }),
            maxAge: 864000,
            sameSite: 'lax',
            secure: true,
            domain
          }
        });
      } else {
        return createResponse(404, { message: 'User does not exist' });
      }
    } catch(e) {
      console.error(e);

      return createResponse(400, { message: 'Invalid credential token' });
    }
  } catch(e) {
    console.error(e);

    return createResponse(500);
  }
}