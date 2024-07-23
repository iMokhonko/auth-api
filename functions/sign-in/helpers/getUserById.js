const infrastructure = require('../infrastructure.cligenerated.json');

const { DynamoDBClient, GetItemCommand } = require('@aws-sdk/client-dynamodb');
const dynamoDbClient = new DynamoDBClient({ region: 'us-east-1' });

const { marshall, unmarshall } = require("@aws-sdk/util-dynamodb");

module.exports = async (userId = null) => {
  try {
    const user = await dynamoDbClient.send(new GetItemCommand({
      TableName: infrastructure.featureResources.dynamodb.tableName,
      Key: marshall({ 
        pk: `USER#ID#${userId}#`,
        sk: `USER#ID#${userId}#`
      })
    }));
  
    return user?.Item ? unmarshall(user?.Item) : null;
  } catch(e) {
    return null;
  }
}