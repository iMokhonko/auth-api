const infrastructure = require('infrastructure.cligenerated.json');

// DynamoDB
const { DynamoDBClient, GetItemCommand } = require('@aws-sdk/client-dynamodb');
const dynamoDbClient = new DynamoDBClient({ region: 'us-east-1' });

module.exports = async (login = '', { loginType = null } = {}) => {
  try {
    const promises = [];

    if(!loginType || loginType === 'email') {
      const getUserByEmail = dynamoDbClient.send(new GetItemCommand({
        TableName: infrastructure.database.dynamo_db_table_name,
        Key: { 
          pk: { S: `USER#EMAIL#${login}#` },
          sk: { S: `USER#EMAIL#${login}#` } 
        }
      }));

      promises.push(getUserByEmail);
    }

    if(!loginType || loginType === 'username') {
      const getUserByUsername = dynamoDbClient.send(new GetItemCommand({
        TableName: infrastructure.database.dynamo_db_table_name,
        Key: { 
          pk: { S: `USER#LOGIN#${login?.toLocaleLowerCase?.()}#` },
          sk: { S: `USER#LOGIN#${login?.toLocaleLowerCase?.()}#` } 
        }
      }));
  
      promises.push(getUserByUsername);
    }
  
    const [
      userByUsername,
      userByEmail
    ] = await Promise.all(promises);
  
    return userByUsername?.Item?.userId?.S ?? userByEmail?.Item?.userId?.S ?? null;
  } catch(e) {
    console.error(e);
    
    return null;
  }
};