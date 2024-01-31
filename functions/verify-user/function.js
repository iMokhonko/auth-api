const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB.DocumentClient({ region: 'us-east-1' });

const infrastructure = require('infrastructure.cligenerated.json');
const services = require('services.cligenerated.json');

const getUserDataByLogin = async (login = '') => {
  try {
    const user = await dynamodb.get({
      TableName: infrastructure.featureResources.dynamodb.tableName,
      Key: { login: `${login}`.toLocaleLowerCase() }
    }).promise();
  
    return user?.Item;
  } catch(error) {
    console.error(error)
    return null;
  }
};

const verifyUserByLogin = async (login = '') => {
  try {
    const params = {
      TableName: infrastructure.featureResources.dynamodb.tableName,
      Key: { login: `${login}`.toLocaleLowerCase() },
      UpdateExpression: 'set isVerified = :isVerified',
      ExpressionAttributeValues:{ ':isVerified': true },
      ReturnValues: 'UPDATED_NEW'
    };

    return await dynamodb.update(params).promise();
  } catch(e) {
    console.error(e);
    
    throw new Error(e);
  }
};

const createResponse = (statusCode = 200, body = {}, { headers = {} } = {}) => ({
  statusCode,

  ...(body && { body: JSON.stringify(body) }),

  headers: {
    "Content-Type": "application/json",
    ...headers
  }
});

exports.handler = async (event) => {
  try {
    const { 
      token = null
    } = event.queryStringParameters;
  
    if(!token) {
      return createResponse(400, { errorMessage: 'Verification token required' });
    }
  
    const decodedData = Buffer.from(token, 'base64').toString('utf8');

    const {
      verificationToken = null,
      login = null
    } = JSON.parse(decodedData);
  
    if(!verificationToken || !login) {
      return createResponse(400, { errorMessage: `Invalid verification token` });
    }

    const user = await getUserDataByLogin(login);

    if(!user) {
      return createResponse(400, { errorMessage: `Invalid verification token` });
    }

    if(user.isVerified) {
      return createResponse(302, { message: `Your email address already verified` }, {
        headers: { Location: `https://${services['www']}` },
      });
    }

    if(user.verificationToken !== verificationToken) {
      return createResponse(400, { errorMessage: `Invalid verification token` });
    }

    await verifyUserByLogin(login);

    return createResponse(302, { message: `Verified` }, {
      headers: { Location: `https://${services['www']}` },
    });
  } catch(e) {
    console.error(e);

    return createResponse(500, { errorMessage: 'Something went wrong. Try again later' });
  }
}