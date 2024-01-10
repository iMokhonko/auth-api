// Load the AWS SDK
const AWS = require('aws-sdk');

// Create the DynamoDB service object
const ddb = new AWS.DynamoDB.DocumentClient({apiVersion: '2012-08-10'});

// const kms = new AWS.KMS({ region: 'us-east-1' });

const { v4: uuidv4 } = require('uuid');
const { OAuth2Client } = require('google-auth-library');

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

const addUserToDB = async ({ login, password, email, firstName, lastName, isEmailVerified = false }) => {
  const userId = uuidv4();

  const transactParams = {
    TransactItems: [
      {
        Put: {
            TableName: infrastructure.database.dynamo_db_table_name,
            Item: { 
              'pk': `USER#ID#${userId}#`,
              'sk': `USER#ID#${userId}#`,
              'createdAt': Date.now(),

              login,
              email,
              password: await encryptPassword(password),
              firstName,
              lastName,
              createdAt: Date.now(),
            },
            ReturnValuesOnConditionCheckFailure: 'ALL_OLD',
            ConditionExpression: 'attribute_not_exists(pk)'
        }
      },
      {
        Put: {
          TableName: infrastructure.database.dynamo_db_table_name,
          Item: {
            'pk': `USER#LOGIN#${login}#`,
            'sk': `USER#LOGIN#${login}#`,
            'userId': userId,
            'createdAt': Date.now(),
          },
          ReturnValuesOnConditionCheckFailure: 'ALL_OLD',
          ConditionExpression: 'attribute_not_exists(pk)',
        },
      },
      {
        Put: {
          TableName: infrastructure.database.dynamo_db_table_name,
          Item: {
            'pk': `USER#EMAIL#${email}#`,
            'sk': `USER#EMAIL#${email}#`,
            'userId': userId,
            'isVerified': isEmailVerified,
            'createdAt': Date.now(),
          },
          ReturnValuesOnConditionCheckFailure: 'ALL_OLD',
          ConditionExpression: 'attribute_not_exists(pk)'
        },
      }
    ]
  };

  try {
    await ddb.transactWrite(transactParams).promise();

    return { success: true };
  } catch(e) {
    if (e.code === "TransactionCanceledException") {
      const errors = parseTransactionCanceledException(e.message);

      const errorsMap = [
        'User with such ID already exist, please try again',
        'User with such login already exist',
        'User with such email already exist'
      ];

      const errorIndex = errors.findIndex(error => error === 'ConditionalCheckFailed');

      if(errorIndex !== -1) {
        return {
          success: false,
          errorMessage: errorsMap[errorIndex]
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

const isLoginValid = login => /^[a-zA-Z0-9_.]+$/.test(login);

const validateEmail = (email) => {
  var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return re.test(String(email).toLowerCase());
}

const verifyUserData = (userData = {}) => {
  // validate login
  if(!userData.login) {
    return {
      isValid: false,
      errorMessage: 'Login required'
    };
  }

  if(!isLoginValid(userData.login)) {
    return {
      isValid: false,
      errorMessage: 'User login should match this expression: [a-z,A-Z,0-9,_,.]'
    };
  }

  // validate password
  if(!userData.email) {
    return {
      isValid: false,
      errorMessage: 'Email required'
    };
  }

  if(!validateEmail(userData.email)) {
    return {
      isValid: false,
      errorMessage: 'Invalid email format'
    };
  }

  // validate password
  if(!userData.password) {
    return {
      isValid: false,
      errorMessage: 'Password required'
    };
  }

  if(!userData.firstName) {
    return {
      isValid: false,
      errorMessage: 'First name required'
    };
  }

  if(!userData.lastName) {
    return {
      isValid: false,
      errorMessage: 'First name required'
    };
  }

  return {
    isValid: true
  };
};

const verifyGoogleCredentialToken = async (credential = null) => {
  if(!credential) return {
    isVerified: false,
    email: null
  };

  const CLIENT_ID = '252143816418-tir6v1dcpo1l5069eoo9bti4h2lcph2j.apps.googleusercontent.com';

  const client = new OAuth2Client(CLIENT_ID);

  try {
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: '252143816418-tir6v1dcpo1l5069eoo9bti4h2lcph2j.apps.googleusercontent.com',
    });
  
    const payload = ticket.getPayload();

    console.log("payload", payload)
    
    return {
      isVerified: !!payload['email'],
      email: payload['email']
    }
  } catch(e) {
    return {
      isVerified: false,
      email: null
    };
  }
};

exports.handler = async ({ body = {} } = {}) => {
  try {
    const {
      login = '',
      password = '',
      email = '',
      firstName = '',
      lastName = '',
      googleCredential = null
    } = JSON.parse(body) ?? {};

    const normalizedLogin = `${login}`.trim().toLocaleLowerCase();
    const normalizedEmail = `${email}`.trim();
    const normalizedFirstName = `${firstName}`.trim();
    const normalizedLastName = `${lastName}`.trim();
    
    const { 
      isValid = false, 
      errorMessage = '' 
    } = verifyUserData({
      login: normalizedLogin,
      password,
      email: normalizedEmail,
      firstName: normalizedFirstName,
      lastName: normalizedLastName
    });

    if(!isValid) {
      return createResponse(400, { errorMessage })
    }

    const verifyGoogleCredentialTokenResult = await verifyGoogleCredentialToken(googleCredential);

    const isEmailVerified = verifyGoogleCredentialTokenResult.isVerified 
      && verifyGoogleCredentialTokenResult.email === normalizedEmail;
  
    const { success, errorMessage: transactionErrorMessage } = await addUserToDB({
      login: normalizedLogin,
      email: normalizedEmail,
      isEmailVerified,
      password,
      firstName: normalizedFirstName,
      lastName: normalizedLastName
    });

    if(success) {
      return createResponse(200, { message: `${normalizedLogin} created` });
    } else {
      return createResponse(400, { message: transactionErrorMessage });
    }
  } catch(e) {
    console.error(e);

    return createResponse(500);
  }
}