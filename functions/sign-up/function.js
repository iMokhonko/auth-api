const { DynamoDBClient, TransactWriteItemsCommand } = require('@aws-sdk/client-dynamodb');
const dynamoDbClient = new DynamoDBClient({ region: 'us-east-1' });

const { v4: uuidv4 } = require('uuid');
const axios = require('axios');
const { marshall } = require("@aws-sdk/util-dynamodb");

const infrastructure = require('infrastructure.cligenerated.json');

const encryptPassword = async (password) => {
  return password;
}

const parseTransactionCanceledException = (str) => {
  const start = str.indexOf('[');
  const end = str.indexOf(']');
  const arrayStr = str.substring(start+1, end);

  return arrayStr.split(', ').map(x => x === 'None' ? null : x);
}

const addUserToDB = async ({ username, password, email, firstName, lastName, isEmailVerified = false }) => {
  const userId = uuidv4();

  const transactWriteItemsParams = {
    TransactItems: [
      {
        Put: {
            TableName: infrastructure.featureResources.dynamodb.tableName,
            Item: marshall({ 
              'pk': `USER#ID#${userId}#`,
              'sk': `USER#ID#${userId}#`,
              'createdAt': Date.now(),

              username,
              email,
              password: await encryptPassword(password),
              firstName,
              lastName,
              createdAt: Date.now(),
            }),
            ReturnValuesOnConditionCheckFailure: 'ALL_OLD',
            ConditionExpression: 'attribute_not_exists(pk)'
        }
      },
      {
        Put: {
          TableName: infrastructure.featureResources.dynamodb.tableName,
          Item: marshall({
            'pk': `USER#USERNAME#${username}#`,
            'sk': `USER#USERNAME#${username}#`,
            'userId': userId,
            'createdAt': Date.now(),
          }),
          ReturnValuesOnConditionCheckFailure: 'ALL_OLD',
          ConditionExpression: 'attribute_not_exists(pk)',
        },
      },
      {
        Put: {
          TableName: infrastructure.featureResources.dynamodb.tableName,
          Item: marshall({
            'pk': `USER#EMAIL#${email}#`,
            'sk': `USER#EMAIL#${email}#`,
            'userId': userId,
            'isVerified': isEmailVerified,
            'createdAt': Date.now(),
          }),
          ReturnValuesOnConditionCheckFailure: 'ALL_OLD',
          ConditionExpression: 'attribute_not_exists(pk)'
        },
      }
    ]
  };

  if(!isEmailVerified) {
    const token = Buffer.from(JSON.stringify({
      token: uuidv4(),
      email
    })).toString('base64');

    transactWriteItemsParams.TransactItems.push({
      Put: {
        TableName: infrastructure.featureResources.dynamodb.tableName,
        Item: marshall({
          pk: `USER#EMAIL#${email}#`,
          sk: `USER#EMAIL_VERIFICATION_TOKEN#${email}#`,
          token,
          username,
          createdAt: Date.now(),
        }),
        ReturnValuesOnConditionCheckFailure: 'ALL_OLD',
      }
    });
  }

  const transactWriteItemsCommand = new TransactWriteItemsCommand(transactWriteItemsParams);

  try {
    await dynamoDbClient.send(transactWriteItemsCommand);

    return { isSuccess: true };
  } catch(e) {
    if (e.code === "TransactionCanceledException") {
      const errors = parseTransactionCanceledException(e.message);

      // errors map order should match TransactItems order
      const errorsMap = [
        ['unknown', 'User with such ID already exist, please try again'],
        ['username', 'User with such username already exist'],
        ['email', 'User with such email already exist']
      ];

      const errorIndex = errors.findIndex(error => error === 'ConditionalCheckFailed');

      if(errorIndex !== -1) {
        return {
          isSuccess: false,
          transactionErrors: {
            [errorsMap[errorIndex][0]]: [errorsMap[errorIndex][1]]
          }
        }
      } else {
        throw new Error('Unhandled error', e);
      }
    } else {
      throw e;
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

const isUsernameValid = username => /^[a-zA-Z0-9_.]+$/.test(username);

const validateEmail = (email) => {
  var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return re.test(String(email).toLowerCase());
}

const verifyUserData = (userData = {}) => {
  const errors = {};

  // validate username
  if(!userData.username) {
    errors.username = [...(errors.username ?? []), 'Username is required'];
  }

  if(!isUsernameValid(userData.username)) {
    errors.username = [...(errors.username ?? []), 'Username can contain only letters, numbers, underscores and dots'];
  }

  if(!userData.email) {
    errors.email = [...(errors.email ?? []), 'Email is required'];
  }

  if(!validateEmail(userData.email)) {
    errors.email = [...(errors.email ?? []), 'Invalid email format'];
  }

  if(!userData.password) {
    errors.password = [...(errors.password ?? []), 'Password is required'];
  }

  if(userData.password.length < 6) {
    errors.password = [...(errors.password ?? []), 'Password should be longer than 5 characters'];
  }

  if(!userData.firstName) {
    errors.firstName = [...(errors.firstName ?? []), 'Firstname is required'];
  }

  if(!userData.lastName) {
    errors.lastName = [...(errors.lastName ?? []), 'Lastname is required'];
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

const verifyGoogleAccessToken = async (accessToken = null) => {
  if(!accessToken) return {
    isVerified: false,
    email: null
  };

  try {
    const { data } = await axios.get(
      'https://www.googleapis.com/oauth2/v2/userinfo', 
      { 
        headers: { 
          Authorization: `Bearer ${accessToken}` 
        } 
      }
    );
  
    if(data.error) {
      throw new Error('Invalid token')
    }
  
    return {
      isVerified: true,
      ...data
    }
  } catch(e) {
    return {
      isVerified: false,
      email: null
    }
  }
};

exports.handler = async ({ body = {} } = {}) => {
  try {
    const {
      username = '',
      password = '',
      email = '',
      firstName = '',
      lastName = '',
      googleAuthAccessToken = null
    } = JSON.parse(body) ?? {};

    const normalizedUsername = `${username}`.trim().toLocaleLowerCase();
    const normalizedEmail = `${email}`.trim();
    const normalizedFirstName = `${firstName}`.trim();
    const normalizedLastName = `${lastName}`.trim();
    
    const { 
      isValid = false, 
      errors = []
    } = verifyUserData({
      username: normalizedUsername,
      password,
      email: normalizedEmail,
      firstName: normalizedFirstName,
      lastName: normalizedLastName
    });

    if(!isValid) {
      return createResponse(400, { errors })
    }

    const verifyGoogleAccessTokenResult = await verifyGoogleAccessToken(googleAuthAccessToken);

    const isEmailVerified = verifyGoogleAccessTokenResult.isVerified 
      && verifyGoogleAccessTokenResult.email === normalizedEmail;
  
    const { isSuccess, transactionErrors } = await addUserToDB({
      username: normalizedUsername,
      email: normalizedEmail,
      isEmailVerified,
      password,
      firstName: normalizedFirstName,
      lastName: normalizedLastName
    });

    if(isSuccess) {
      return createResponse(200, { message: `${normalizedUsername} created` });
    } else {
      return createResponse(400, { errors: transactionErrors });
    }
  } catch(e) {
    console.error(e);

    return createResponse(500);
  }
}