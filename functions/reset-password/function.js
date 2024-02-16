// Load the AWS SDK
const AWS = require('aws-sdk');
const { v4: uuidv4 } = require('uuid');
const ses = new AWS.SES();

// Create the DynamoDB service object
const ddb = new AWS.DynamoDB.DocumentClient({apiVersion: '2012-08-10'});

const infrastructure = require('infrastructure.cligenerated.json');
const { env } = require('env.cligenerated.json');
const services = require('services.cligenerated.json');

const validateEmail = (email) => {
  var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return re.test(String(email).toLowerCase());
}

const createUserResetTokenInDatabase = async (email) => {
  const token = Buffer.from(JSON.stringify({
    token: uuidv4(),
    email // include email so it would be easier retrieve user data
  })).toString('base64');

  const transactParams = {
    TransactItems: [
      {
        ConditionCheck: {
          TableName: infrastructure.featureResources.dynamodb.tableName,
          Key: { 
            'pk': `USER#EMAIL#${email}#`,
            'sk': `USER#EMAIL#${email}#`,
          },
          ConditionExpression: 'attribute_exists(pk) AND attribute_exists(sk)',
          ReturnValuesOnConditionCheckFailure: 'ALL_OLD'
        },
      },
      {
        Put: {
            TableName: infrastructure.featureResources.dynamodb.tableName,
            Item: { 
              'pk': `USER#EMAIL#${email}#`,
              'sk': `USER#RESET_PASSWORD_TOKEN#${email}#`,
              'createdAt': Date.now(),

              token,

              ttl: Math.floor((Date.now() + 86400000) / 1000) // 1 day
            },
            ReturnValuesOnConditionCheckFailure: 'ALL_OLD',
        }
      }
    ]
  };

  try {
    await ddb.transactWrite(transactParams).promise();

    return { 
      isSuccess: true,
      token,
     }
  } catch(e) {
    console.error(e);

    if (e.code === "TransactionCanceledException") {
      // in case such user does not exist still return success
      // so others cannot determine if such email exist
      return { isSuccess: true }
    } else {
      console.error(e);

      return { 
        isSuccess: false,
        error: 'Something went wrong'
      }
    }
  }
};

const getUserDataByResetToken = async (resetToken) => {
  try {
    // resetToken is base64 encoded JSON string
    // this JSON includes unique token and user email
    const { email } = JSON.parse(Buffer.from(resetToken, 'base64').toString()) ?? {};

    if(!email) return null;

    const params = {
      TableName: infrastructure.featureResources.dynamodb.tableName,
      Key: {
        'pk': `USER#EMAIL#${email}#`,
        'sk': `USER#EMAIL#${email}#`
      }
    };

    const data = await ddb.get(params).promise();

    return { 
      userId: data?.Item?.userId ?? null,
      email
    };
  } catch(e) {
    return null;
  }
};

const checkIfResetTokenExist = async(email, resetToken) => {
  try {
    const params = {
      TableName: infrastructure.featureResources.dynamodb.tableName,
      Key: {
        'pk': `USER#EMAIL#${email}#`,
        'sk': `USER#RESET_PASSWORD_TOKEN#${email}#`
      }
    };

    const data = await ddb.get(params).promise();

    const { token = null, ttl = null } = data?.Item ?? {};

    // if item ttl is already expired
    if(ttl <= Math.floor((Date.now()) / 1000)) {
      return false;
    }

    return token === resetToken;
  } catch(e) {
    console.error(e);

    return false;
  }
};

const resetUserPassword = async (resetToken, password) => {
  const { userId, email } = await getUserDataByResetToken(resetToken) ?? {};

  if(!userId || !email) {
    return { 
      isSuccess: false,
      error: 'Invalid reset token'
    }
  }

  // Transaction request cannot include multiple operations on one item
  // so we need to check if resetToken exist manually
  const isResetTokenExist = await checkIfResetTokenExist(email, resetToken);

  if(!isResetTokenExist) {
    return { 
      isSuccess: false,
      error: 'Invalid reset token'
    }
  }

  const transactParams = {
    TransactItems: [
      {
        Update: {
          TableName: infrastructure.featureResources.dynamodb.tableName,
          Key: { 
            'pk': `USER#ID#${userId}#`,
            'sk': `USER#ID#${userId}#`,
          },
          UpdateExpression: "SET #password = :password",
          ExpressionAttributeNames: {
            "#password": "password"
          },
          ExpressionAttributeValues: {
            ":password": password
          },
          ReturnValuesOnConditionCheckFailure: 'ALL_OLD',
          ConditionExpression: 'attribute_exists(pk) AND attribute_exists(sk)',
        }
      },
      {
        Delete: {
          TableName: infrastructure.featureResources.dynamodb.tableName,
          Key: { 
            'pk': `USER#EMAIL#${email}#`,
            'sk': `USER#RESET_PASSWORD_TOKEN#${email}#`,
          },
          ReturnValuesOnConditionCheckFailure: 'ALL_OLD',
        }
      }
    ]
  };

  try {
    await ddb.transactWrite(transactParams).promise();

    return { isSuccess: true };
  } catch(e) {
    if (e.code === "TransactionCanceledException") {
      return { 
        isSuccess: false,
        error: 'Invalid reset token'
      }
    } else {
      console.error(e);

      return { 
        isSuccess: false,
        error: 'Something went wrong'
      }
    }
  }
};

const getEmailTemplateByName = async (templateName) => {
  try {
    const data = await ses.getTemplate({ TemplateName: templateName }).promise();
    const { TextPart, HtmlPart, SubjectPart } = data.Template;

    return { text: TextPart, html: HtmlPart, subject: SubjectPart };
  } catch (err) {
    console.error(err, err.stack);
  }
};

const sendResetPasswordEmail = async (to, { text, html, subject }, resetToken) => {
  const formattedHtml = html
    .replaceAll('[[username]]', to)
    .replaceAll('[[resetPasswordLink]]', `https://${services['auth']}/reset-password?resetPasswordToken=${resetToken}`);

  const formattedText = text
    .replaceAll('[[username]]', to)
    .replaceAll('[[resetPasswordLink]]', `https://${services['auth']}/reset-password?resetPasswordToken=${resetToken}`)

  const params = {
    Destination: { ToAddresses: [to] },

    Source: "iMokhonko Ukraine <no-reply@imokhonko.com>",

    Message: {
      Body: {
        Html: {
          Charset: "UTF-8",
          Data: formattedHtml
        },

        Text: {
          Charset: "UTF-8",
          Data: formattedText
        }
        },
        
        Subject: {
          Charset: 'UTF-8',
          Data: subject
        }
    },
  };

  await ses.sendEmail(params).promise();
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
  const { action } = event?.queryStringParameters ?? {};

  switch(action) {
    case 'request_password_reset': {
      const {
        email = ''
      } = JSON.parse(event?.body ?? '{}');

      const normalizedEmail = email?.trim();

      if(!validateEmail(normalizedEmail)) {
        return createResponse(400, { error: 'Invalid email' });
      }

      const { 
        isSuccess: isResetTokenCreated,
        error: resetTokenCreationErrorMessage,
        token
      } = await createUserResetTokenInDatabase(normalizedEmail);

      if(!isResetTokenCreated) {
        return createResponse(200, { error: resetTokenCreationErrorMessage });
      }

      const { html, text, subject } = await getEmailTemplateByName(`${env}-master-ResetPassword`);

      await sendResetPasswordEmail(
        normalizedEmail,
        { html, text, subject },
        token
      );

      return createResponse(200, { error: 'If your email address exists in our database, you will receive a password recovery email' });
    }

    case 'reset_password': {
      const {
        token = null,
        password = null
      } = JSON.parse(event?.body ?? '{}');

      if(!token) return createResponse(400, { error: 'Token is required' });
      if(!password) return createResponse(400, { error: 'New password is required' });
      if(password.length < 6) return createResponse(400, { error: 'Password should be longer than 5 characters' });

      const { 
        isSuccess,
        error
      } = await resetUserPassword(token, password);

      if(!isSuccess) return createResponse(400, { error });

      return createResponse(200, { message: 'Password reset' });
    }

    default: {
      return createResponse(400, { error: 'Invalid action' });
    }
  }
};