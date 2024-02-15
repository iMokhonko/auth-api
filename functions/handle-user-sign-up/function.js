const AWS = require('aws-sdk');
const ses = new AWS.SES();

const services = require('./services.cligenerated.json');
const { env } = require('env.cligenerated.json');

const getEmailTemplateByName = async (templateName) => {
  try {
    const data = await ses.getTemplate({ TemplateName: templateName }).promise();
    const { TextPart, HtmlPart, SubjectPart } = data.Template;

    return { text: TextPart, html: HtmlPart, subject: SubjectPart };
  } catch (err) {
    console.error(err, err.stack);
  }
};

const sendVerifyEmail = async (to, { text, html, subject }, { token, username }) => {
  const verificationLink = `https://${services['auth-api']}/verify?token=${token}`;

  const formattedHtml = html
    .replaceAll('[[username]]', username)
    .replaceAll('[[verifyEmailLink]]', verificationLink);

  const formattedText = text
    .replaceAll('[[username]]', username)
    .replaceAll('[[verifyEmailLink]]', verificationLink)

  const params = {
    Destination: { ToAddresses: [to] },

    Source: "iMokhonko Ukraine <no-reply@imokhonko.com>",

    Message: {
      Body: {
        Html: {
          Charset: "UTF-8",
          Data: formattedHtml
        },

        Text: {
          Charset: "UTF-8",
          Data: formattedText
        }
        },
        
        Subject: {
          Charset: 'UTF-8',
          Data: subject
        }
    },
  };

  await ses.sendEmail(params).promise();
};

exports.handler = async (event) => {  
  // include only new users and with unverified email
  const records = event.Records.filter(
    ({ eventName, dynamodb }) => {
      const isInsertEvent = eventName === 'INSERT';

      const newImage = dynamodb?.NewImage ?? {};

      const { pk, sk } = newImage ?? {};

      return isInsertEvent 
        && pk.S.startsWith('USER#EMAIL#') 
        && sk.S.startsWith('USER#EMAIL_VERIFICATION_TOKEN#')
    }
  );

  while(records.length) {
    const record = records.pop();

    const { pk, token, username } = record.dynamodb.NewImage;

    const email = pk.S.slice(11, -1);

    const { html, text, subject } = await getEmailTemplateByName(`${env}-master-VerifyEmail`);
    
    await sendVerifyEmail(
      email,
      { html, text, subject },
      { token: token.S, username: username.S }
    );
  }
}