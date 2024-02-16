const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB.DocumentClient({ region: 'us-east-1' });

const infrastructure = require('infrastructure.cligenerated.json');
const services = require('services.cligenerated.json');

const getVerificationTokenByEmail = async (email) => {
  try {
    if(!email) return null;

    const params = {
      TableName: infrastructure.featureResources.dynamodb.tableName,
      Key: {
        'pk': `USER#EMAIL#${email}#`,
        'sk': `USER#EMAIL_VERIFICATION_TOKEN#${email}#`
      }
    };

    const data = await dynamodb.get(params).promise();

    return data?.Item?.token ?? null;
  } catch(e) {
    return null;
  }
};

const verifyUserEmail = async (email) => {
  const transactParams = {
    TransactItems: [
      {
        Update: {
          TableName: infrastructure.featureResources.dynamodb.tableName,
          Key: { 
            'pk': `USER#EMAIL#${email}#`,
            'sk': `USER#EMAIL#${email}#`,
          },
          UpdateExpression: "SET #isVerified = :isVerified",
          ExpressionAttributeNames: { "#isVerified": "isVerified" },
          ExpressionAttributeValues: { ":isVerified": true },
          ReturnValuesOnConditionCheckFailure: 'ALL_OLD',
          ConditionExpression: 'attribute_exists(pk) AND attribute_exists(sk)',
        }
      },
      {
        Delete: {
          TableName: infrastructure.featureResources.dynamodb.tableName,
          Key: { 
            'pk': `USER#EMAIL#${email}#`,
            'sk': `USER#EMAIL_VERIFICATION_TOKEN#${email}#`,
          },
          ReturnValuesOnConditionCheckFailure: 'ALL_OLD',
        }
      }
    ]
  };

  try {
    await dynamodb.transactWrite(transactParams).promise();

    return { isSuccess: true };
  } catch(e) {
    if (e.code === "TransactionCanceledException") {
      return { 
        isSuccess: false,
        error: 'Invalid verification token'
      }
    } else {
      console.error(e);

      return { 
        isSuccess: false,
        error: 'Something went wrong, please try again later'
      }
    }
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
      token: base64Token = null
    } = event.queryStringParameters;
  
    if(!base64Token) {
      return createResponse(400, { errorMessage: 'Verification token required' });
    }

    console.log('user provided token', base64Token);

    const { email, token } = JSON.parse(Buffer.from(base64Token, 'base64').toString()) ?? {};

    if(!email || !token) {
      return createResponse(400, { errorMessage: `Invalid verification token` });
    }

    const userEmailVerificationToken = await getVerificationTokenByEmail(email);

    console.log('userEmailVerificationToken', userEmailVerificationToken);

    // if token does not exist it means user is verified
    if(!userEmailVerificationToken) {
      return createResponse(
        302, 
        { message: `${email} verified` }, 
        { headers: { Location: `https://${services['auth']}/email-verification-success-page?message=${encodeURIComponent(`${email} verified!`)}` },
      });
    }

    if(userEmailVerificationToken !== base64Token) {
      return createResponse(
        302, 
        { message: `Invalid verification token` }, 
        { headers: { Location: `https://${services['auth']}/email-verification-error-page?message=${encodeURIComponent(`Invalid verification token`)}` },
      });
    }

    const { isSuccess, error } = await verifyUserEmail(email);
    
    if(isSuccess) {
      return createResponse(
        302, 
        { message: `${email} verified` },
        { headers: { Location: `https://${services['auth']}/email-verification-success-page?message=${encodeURIComponent(`${email} verified!`)}` },
      });
    } else {
      return createResponse(
        302, 
        { message: error }, 
        { headers: { Location: `https://${services['auth']}/email-verification-error-page?message=${encodeURIComponent(error)}` },
      });
    }
  } catch(e) {
    console.error(e);

    return createResponse(500, { errorMessage: 'Something went wrong. Try again later' });
  }
}