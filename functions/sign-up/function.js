const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB.DocumentClient();
const kms = new AWS.KMS();

// const infrastructure = require('../../infrastructure.json');

const encryptPassword = async (password) => {
  try {
    const data = await kms.encrypt({
      KeyId: 'af536286-f6c0-460c-a365-43d66834f710',  // The ID of the AWS KMS key you want to use.
      Plaintext: password,  // The plaintext data to encrypt.
    }).promise();

    // The cipher text blob.
    const cipherTextBlob = data.CiphertextBlob.toString('base64');
    console.log(cipherTextBlob);
    
    return cipherTextBlob;
  } catch (err) {
      console.log(err);
      throw err;
  }
}

exports.handler = async (event) => {
  console.log('Event', event);

  const { httpMethod } = event;

  switch(httpMethod) {
    case 'GET': {
      const params = {
        TableName: 'dev-auth-api-users-table',
        Item: {
            login: `kek-------lol-${Date.now()}`,
            created: Date.now(),
            password: await encryptPassword('1234')
        }
    };

    try {
        const data = await dynamodb.put(params).promise();

        console.log("Successfully added item:", JSON.stringify(data, null, 2));

        return {
          statusCode: 200,
          body: JSON.stringify({
            message: 'Successfully added item',
            item: JSON.stringify(data, null, 2)
          })
        }
      } catch (err) {
          return {
            statusCode: 200,
            body: JSON.stringify({
              message: 'Unable to add item. Error JSON',
              error: JSON.stringify(err, null, 2)
            })
          }
      }
    }
    case 'POST': {
      return {
        statusCode: 200,
        body: JSON.stringify({
          message: 'POST METHOD INVOKED'
        })
      }
    }
    default: {
      return {
        statusCode: 200,
        body: JSON.stringify({
          message: 'ANOTHER METHOD INVOKED'
        })
      }
    }
  }
}