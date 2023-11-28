const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB.DocumentClient({ region: 'us-east-1' });
// const kms = new AWS.KMS({ region: 'us-east-1' });

const { v4: uuidv4 } = require('uuid');

const infrastructure = require('infrastructure.cligenerated.json');

const encryptPassword = async (password) => {
  return password;

  try {
    const data = await kms.encrypt({
      KeyId: 'af536286-f6c0-460c-a365-43d66834f710',  // The ID of the AWS KMS key you want to use.
      Plaintext: password,  // The plaintext data to encrypt.
    }).promise();

    return data.CiphertextBlob.toString('base64');
  } catch (err) {
      console.log(err);
      throw err;
  }
}

const isUserExistWithLogin = async (login = '') => {
  try {
    const user = await dynamodb.get({
      TableName: infrastructure.database.dynamo_db_table_name,
      Key: { login: `${login}`.toLocaleLowerCase() }
    }).promise();
  
    return Boolean(user?.Item);
  } catch(error) {
    console.error(error);

    // return that login exist to prevent creating the same login if lambda can't determine if this login is unique
    return true;
  }
};

const isUserExistWithEmail = async (email = '') => {
  try {
    const userExistParams = {
      TableName: infrastructure.database.dynamo_db_table_name,
      IndexName: infrastructure.database.gsi_index_name, 
      KeyConditionExpression: "email = :user_email",
      ExpressionAttributeValues: {
        ":user_email": email
      }
    }; 
  
    const queryResult = await dynamodb.query(userExistParams).promise();

    return Boolean(queryResult?.Items?.length);
  } catch (error) {
    console.error(error);
    // return that email exist to prevent creating the same email if lambda can't determine if this email is unique
    return true;
  }
};

const addUserToDB = async ({ login, password, email, firstName, lastName }) => {
  const params = {
    TableName: infrastructure.database.dynamo_db_table_name,
    Item: {
        login,
        email,
        password: await encryptPassword(password),
        firstName,
        lastName,
        verificationToken: uuidv4(),
        isVerified: false,
        created: Date.now(),
    }
  };

  return await dynamodb.put(params).promise();
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

exports.handler = async ({ body = {} } = {}) => {
  try {
    const {
      login = '',
      password = '',
      email = '',
      firstName = '',
      lastName = ''
    } = JSON.parse(body) ?? {};

    const normalizedLogin = `${login}`.trim();
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

    const [
      isUserWithThisLoginExist,
      isUserWithThisEmailExist
    ] = await Promise.all([
      isUserExistWithLogin(normalizedLogin),
      isUserExistWithEmail(normalizedEmail)
    ]);
  
    if(isUserWithThisLoginExist) {
      return createResponse(409, { 
        errorMessage: `User with ${normalizedLogin} already exist` 
      });
    }

    if(isUserWithThisEmailExist) {
      return createResponse(409, { 
        errorMessage: `User with ${normalizedEmail} already exist` 
      });
    }
  
    await addUserToDB({
      login: normalizedLogin,
      email: normalizedEmail,
      password,
      firstName: normalizedFirstName,
      lastName: normalizedLastName
    });

    return createResponse(200, { message: `${normalizedLogin} created` });
  } catch(e) {
    console.error(e);

    return createResponse(500);
  }
}