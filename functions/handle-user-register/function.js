const AWS = require('aws-sdk');
const ses = new AWS.SES();

const env = require('./env.cligenerated.json');

exports.handler = async (event) => {  
  // // include only new users
  // const records = event.Records.filter(
  //   ({ eventName, dynamodb }) => {
  //     const isInsertEvent = eventName === 'INSERT';

  //     const newImage = dynamodb?.NewImage ?? {};

  //     const { email } = newImage ?? {};

  //     return isInsertEvent && email;
  //   }
  // );

  // while(records.length) {
  //   const record = records.pop();

  //   const { email, login, verificationToken } = record.dynamodb.NewImage;

  //   const componsedData = JSON.stringify({
  //     verificationToken: verificationToken.S,
  //     login: login.S
  //   });

  //   const encodedToken = Buffer.from(componsedData).toString('base64');

  //   const verificationLink = `https://${env['auth-api']}/verify?token=${encodedToken}`

  //   const params = {
  //     Destination: { ToAddresses: [email.S] },

  //     Message: {
  //       Body: { Html: { Data: `
  //       Hey, <b>${login.S}</b>, welcome to our website! We are glad to see you!
  //       <br>
  //       In order to confirm your email here please open this link -> <a target="_blank" href="${verificationLink}">${verificationLink}</a>
  //       ` } },
  //       Subject: { Data: 'Welcome message!' }
  //     },

  //     Source: "iMokhonko Ukraine <no-reply@imokhonko.com>"
  //   };

  //   await ses.sendEmail(params).promise();
  // }
}