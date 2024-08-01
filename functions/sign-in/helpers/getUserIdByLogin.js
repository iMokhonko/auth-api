const infrastructure = require('infrastructure.cligenerated.json');

// DynamoDB
const { DynamoDBClient, GetItemCommand } = require('@aws-sdk/client-dynamodb');
const dynamoDbClient = new DynamoDBClient({ region: 'eu-central-1' });

const { marshall, unmarshall } = require("@aws-sdk/util-dynamodb");

module.exports = async (login = '', { loginType = null } = {}) => {
  try {
    const promises = [];

    if(!loginType || loginType === 'email') {
      const getUserByEmail = dynamoDbClient.send(new GetItemCommand({
        TableName: infrastructure.featureResources.dynamodb.tableName,
        Key: marshall({ 
          pk: `USER#EMAIL#${login}#`,
          sk: `USER#EMAIL#${login}#`
        })
      }));

      promises.push(getUserByEmail);
    }

    if(!loginType || loginType === 'username') {
      const getUserByUsername = dynamoDbClient.send(new GetItemCommand({
        TableName: infrastructure.featureResources.dynamodb.tableName,
        Key: marshall({ 
          pk: `USER#USERNAME#${login?.toLocaleLowerCase?.()}#`,
          sk: `USER#USERNAME#${login?.toLocaleLowerCase?.()}#`
        })
      }));
  
      promises.push(getUserByUsername);
    }
  
    const [
      userByUsername,
      userByEmail
    ] = await Promise.all(promises);

    const normalizedUserByUsername = userByUsername?.Item?.userId 
      ? unmarshall(userByUsername?.Item)
      : null;

    const normalizedUserByEmail = userByEmail?.Item?.userId 
      ? unmarshall(userByEmail?.Item)
      : null;

    return normalizedUserByUsername?.userId ?? normalizedUserByEmail?.userId ?? null;
  } catch(e) {
    console.error(e);
    
    return null;
  }
};