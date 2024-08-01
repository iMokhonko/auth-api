const { SESClient, GetTemplateCommand, SendEmailCommand } = require("@aws-sdk/client-ses");
const sesClient = new SESClient({ region: 'eu-central-1' });

const { DynamoDBClient, TransactWriteItemsCommand, GetItemCommand } = require('@aws-sdk/client-dynamodb');
const dynamoDbClient = new DynamoDBClient({ region: 'eu-central-1' });

const { v4: uuidv4 } = require('uuid');
const { marshall, unmarshall } = require("@aws-sdk/util-dynamodb");

const infrastructure = require('infrastructure.cligenerated.json');
const { env } = require('env.cligenerated.json');
const services = require('services.cligenerated.json');

const createResponse = (statusCode = 200, body = {}, { headers = {} } = {}) => ({
  statusCode,
  ...(body && { body: JSON.stringify(body) }),
  headers: {
    "Content-Type": "application/json",
    ...headers
  }
});

const validateEmail = (email) => {
  var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return re.test(String(email).toLowerCase());
}

const createUserResetTokenInDatabase = async (email) => {
  const token = Buffer.from(JSON.stringify({
    token: uuidv4(),
    email // include email so it would be easier retrieve user data
  })).toString('base64');

  const transactWriteItemsParams = {
    TransactItems: [
      {
        ConditionCheck: {
          TableName: infrastructure.featureResources.dynamodb.tableName,
          Key: marshall({ 
            'pk': `USER#EMAIL#${email}#`,
            'sk': `USER#EMAIL#${email}#`,
          }),
          ConditionExpression: 'attribute_exists(pk) AND attribute_exists(sk)',
          ReturnValuesOnConditionCheckFailure: 'ALL_OLD'
        },
      },
      {
        Put: {
            TableName: infrastructure.featureResources.dynamodb.tableName,
            Item: marshall({ 
              'pk': `USER#EMAIL#${email}#`,
              'sk': `USER#RESET_PASSWORD_TOKEN#${email}#`,
              'createdAt': Date.now(),

              token,

              ttl: Math.floor((Date.now() + 86400000) / 1000) // 1 day
            }),
            ReturnValuesOnConditionCheckFailure: 'ALL_OLD',
        }
      }
    ]
  };

  const transactWriteItemsCommand = new TransactWriteItemsCommand(transactWriteItemsParams);

  try {
    await dynamoDbClient.send(transactWriteItemsCommand);

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

    const getItemCommandParams = {
      TableName: infrastructure.featureResources.dynamodb.tableName,
      Key: marshall({
        'pk': `USER#EMAIL#${email}#`,
        'sk': `USER#EMAIL#${email}#`
      })
    };

    const getItemCommand = new GetItemCommand(getItemCommandParams);
    const data = await dynamoDbClient.send(getItemCommand);

    const normalizedUser = unmarshall(data?.Item ?? {});

    return { 
      userId: normalizedUser?.userId ?? null,
      email
    };
  } catch(e) {
    return null;
  }
};

const checkIfResetTokenExist = async(email, resetToken) => {
  try {
    const getItemCommandParams = {
      TableName: infrastructure.featureResources.dynamodb.tableName,
      Key: marshall({
        'pk': `USER#EMAIL#${email}#`,
        'sk': `USER#RESET_PASSWORD_TOKEN#${email}#`
      })
    };

    const getItemCommand = new GetItemCommand(getItemCommandParams);
    const data = await dynamoDbClient.send(getItemCommand);

    const { token = null, ttl = null } = unmarshall(data?.Item ?? {});

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

  const transactWriteItemsParams = {
    TransactItems: [
      {
        Update: {
          TableName: infrastructure.featureResources.dynamodb.tableName,
          Key: marshall({ 
            'pk': `USER#ID#${userId}#`,
            'sk': `USER#ID#${userId}#`,
          }),
          UpdateExpression: "SET #password = :password",
          ExpressionAttributeNames: {
            "#password": "password"
          },
          ExpressionAttributeValues: marshall({
            ":password": password
          }),
          ReturnValuesOnConditionCheckFailure: 'ALL_OLD',
          ConditionExpression: 'attribute_exists(pk) AND attribute_exists(sk)',
        }
      },
      {
        Delete: {
          TableName: infrastructure.featureResources.dynamodb.tableName,
          Key: marshall({ 
            'pk': `USER#EMAIL#${email}#`,
            'sk': `USER#RESET_PASSWORD_TOKEN#${email}#`,
          }),
          ReturnValuesOnConditionCheckFailure: 'ALL_OLD',
        }
      }
    ]
  };

  const transactWriteItemsCommand = new TransactWriteItemsCommand(transactWriteItemsParams);

  try {
    await dynamoDbClient.send(transactWriteItemsCommand);

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
  const command = new GetTemplateCommand({ TemplateName: templateName });

  try {
    const { Template: { TextPart, HtmlPart, SubjectPart } } = await sesClient.send(command);;

    return { text: TextPart, html: HtmlPart, subject: SubjectPart };
  } catch (err) {
    console.error(err, err.stack);
  }
};

const sendResetPasswordEmail = async (to, { text, html, subject }, resetToken) => {
  const formattedHtml = html
    .replaceAll('[[username]]', to)
    .replaceAll('[[resetPasswordLink]]', `https://${services['auth']}?resetPasswordToken=${resetToken}`);

  const formattedText = text
    .replaceAll('[[username]]', to)
    .replaceAll('[[resetPasswordLink]]', `https://${services['auth']}?resetPasswordToken=${resetToken}`)

  const sendEmailCommandParams = {
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

  const sendEmailCommand = new SendEmailCommand(sendEmailCommandParams);
  return await sesClient.send(sendEmailCommand);
};


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