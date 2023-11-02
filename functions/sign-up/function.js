const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB.DocumentClient({ region: 'us-east-1' });
// const kms = new AWS.KMS({ region: 'us-east-1' });

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
    console.error(error)
    return null;
  }
};

const addUserToDB = async ({ login, password }) => {
  const params = {
    TableName: infrastructure.database.dynamo_db_table_name,
    Item: {
        login,
        password: await encryptPassword(password),
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

    if(!isLoginValid(normalizedLogin)) {
      return createResponse(400, { errorMessage: `Login can contain only [a-z,A-Z,0-9,_,.] characters` });
    }
  
    // validate password
    if(!password) {
      return createResponse(400, { errorMessage: `Password required` });
    }
  
    // validate that user with such login does not exist
    const isUserWithThisLoginExist = await isUserExistWithLogin(normalizedLogin);
    if(isUserWithThisLoginExist) {
      return createResponse(409, { 
        errorMessage: `User with ${normalizedLogin} already exist` 
      });
    }
  
    await addUserToDB({
      login: normalizedLogin,
      password
    });

    return createResponse(200, { message: `${normalizedLogin} created` });
  } catch(e) {
    console.error(e);

    return createResponse(500);
  }
}