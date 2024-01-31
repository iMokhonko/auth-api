const fsPromises = require('fs').promises;
const fs = require('fs');
const path = require('path');

const archiveFolder = require('./archiveFolder');
const copyFileToFilder = require('./copyFileToFolder');

const getDirectories = () => {
  const lambdasPath = `${process.cwd()}/functions`;

  return fs.readdirSync(lambdasPath)
    .filter(file => fs.statSync(path.join(lambdasPath, file)).isDirectory())
    .map(folderName => `${process.cwd()}/functions/${folderName}`);
}

const uploadToS3 = async ({ filePath, bucketName, keyName, s3 } = {}) => {
  try {
    const fileData = fs.createReadStream(filePath);

    const params = {
      Bucket: bucketName,
      Key: keyName,
      Body: fileData,
      ContentType: 'application/zip'
    };

    return await s3.putObject(params).promise();
  } catch(err) {
    console.error("Failed to upload lambda zip zrchive:", err);
    throw err;
  }
}

const updateLambdaFunctionCode = async ({ lambda, bucket, key, lambdaName }) => {
  try {
    const params = {
      FunctionName: lambdaName, // the Lambda function whose resource policy you are updating
      S3Bucket: bucket, 
      S3Key: key  //replace with your .zip file in S3
    };
    
    await lambda.updateFunctionCode(params).promise();

    console.log(`${lambdaName} code update!`);

    return true;
  } catch(e) {
    // TODO add debug mode so this warning would be visible
    // console.warn(`Lambda ${lambdaName} is not found`, e);

    return true;
  }
};

module.exports = ({
  serviceName: 'TEST Auth API',

  terraformBackendConfiguration: {
    serviceName: 'test-auth-api',
    bucket: 'tf-state-backend-imokhonko',
    region: 'us-east-1'
  },

  awsConfiguration: {
    region: 'us-east-1',
    profile: 'default',
  },
  
  config: {
    hostedZone: 'imokhonko.com',
    subdomain: 'test-auth-api',
  },

  deploy: async ({ env, feature, infrastructure, AWS, config }) => {

    const lambdasDirPathes = getDirectories('/functions');

    await Promise.all([
      // copy env.json to lambda folder
      ...lambdasDirPathes.map(folderPath => copyFileToFilder('env.cligenerated.json', `${folderPath}/env.cligenerated.json`)),

      // copy infrastructure.json to lambdas folder
      ...lambdasDirPathes.map(folderPath => copyFileToFilder('infrastructure.cligenerated.json', `${folderPath}/infrastructure.cligenerated.json`))
    ]);

    // archive lambda functions folders
    const archives = await Promise.all(
      lambdasDirPathes.map(folderPath => archiveFolder(folderPath, `${folderPath}/__bundle__.cligenerated.zip`))
    );

    const s3 = new AWS.S3();
    const lambda = new AWS.Lambda({ region: 'us-east-1' });

    // upload lambdas zips to S3 bucket
    await Promise.all([
      ...archives.map(filePath => {
        const pathFolders = filePath.split('/');
        const name = pathFolders[pathFolders.length - 2];

        return uploadToS3({ 
          filePath, 
          s3,
          bucketName: infrastructure.globalResources.s3.bucketId,
          keyName: `${env}/${feature}/${name}.zip`, 
        });
      })
    ]);

    // Update lambdas code for newly uploaded zip archives
    await Promise.all([
      ...archives.map(filePath => {
        const pathFolders = filePath.split('/');
        const name = pathFolders[pathFolders.length - 2];

        return updateLambdaFunctionCode({ 
          lambda,
          lambdaName: `${env}-${feature}-${config.subdomain}-${name}`,
          bucket: infrastructure.globalResources.s3.bucketId, 
          key: `${env}/${feature}/${name}.zip`, 
        });
      }),

      // remove all zip files
      ...archives.map(filePath => fsPromises.unlink(filePath))
    ]);
  } 
});