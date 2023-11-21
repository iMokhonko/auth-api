exports.handler = async (event, context, callback) => {
  console.log('test', event.Records);
  
  event.Records.forEach(function(record) {
    if (record.eventName === 'INSERT') {
      const newImage = record.dynamodb.NewImage;
      console.log('New Image:', JSON.stringify(newImage));
    }
  });

  // callback(null, `Successfully processed ${event.Records.length} records.`);
}