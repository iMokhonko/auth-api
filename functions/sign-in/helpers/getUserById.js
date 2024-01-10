const infrastructure = require('../infrastructure.cligenerated.json');

const { DynamoDBClient, GetItemCommand } = require('@aws-sdk/client-dynamodb');
const dynamoDbClient = new DynamoDBClient({ region: 'us-east-1' });

module.exports = async (userId = null) => {
  try {
    const user = await dynamoDbClient.send(new GetItemCommand({
      TableName: infrastructure.database.dynamo_db_table_name,
      Key: { 
        pk: { S: `USER#ID#${userId}#` },
        sk: { S: `USER#ID#${userId}#` } 
      }
    }));
  
    return user?.Item ?? null;
  } catch(e) {
    return null;
  }
}