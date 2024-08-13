const fsPromises = require('fs').promises;
const fs = require('fs');
const path = require('path');

const archiveFolder = require('./archiveFolder');
const copyFileToFilder = require('./copyFileToFolder');

// AWS
const { LambdaClient, UpdateFunctionCodeCommand } = require("@aws-sdk/client-lambda");
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");

const getDirectories = (folderPath) => {
  const lambdasPath = `${process.cwd()}${folderPath}`;

  return fs.readdirSync(lambdasPath)
    .filter(file => fs.statSync(path.join(lambdasPath, file)).isDirectory())
    .map(folderName => `${process.cwd()}${folderPath}/${folderName}`);
}

const uploadToS3 = async ({ s3Client, filePath, bucketName, keyName } = {}) => {
  try {
    const commandParams = {
      Bucket: bucketName,
      Key: keyName,
      Body: fs.createReadStream(filePath),
      ContentType: 'application/zip'
    };

    const command = new PutObjectCommand(commandParams);
    return await s3Client.send(command);
  } catch(err) {
    console.error("Failed to upload lambda zip zrchive:", err);
    throw err;
  }
}

const updateLambdaFunctionCode = async ({ lambdaClient, bucket, key, lambdaName }) => {
  try {
    const commandParams = { // UpdateFunctionCodeRequest
      FunctionName: lambdaName, // the Lambda function whose resource policy you are updating
      S3Bucket: bucket,
      S3Key: key  //replace with your .zip file in S3
    };

    const command = new UpdateFunctionCodeCommand(commandParams);
    await lambdaClient.send(command);

    console.log(`${lambdaName} code update!`);

    return true;
  } catch(e) {
    // TODO add debug mode so this warning would be visible
    console.warn(`Lambda ${lambdaName} is not found`, e);

    return true;
  }
};

module.exports = ({
  serviceName: 'Auth API',

  terraformBackendConfiguration: {
    serviceName: 'auth-api',
    bucket: 'tfstate-floor13',
    region: 'eu-central-1'
  },

  awsConfiguration: [
    {
      region: 'eu-central-1',
      profile: 'default',
    },
    {
      // for terraform `route_53_subdomain` module we need 
      // to create TLS certificate in us-east-1 region
      // so cloudfront can use this certificate
      region: 'us-east-1',
      profile: 'default',
      alias: 'us_east_1'
    }
  ],
  
  config: {
    hostedZone: 'imokhonko.com',
    subdomain: 'api.auth',
  },

  preDeploy: async () => {
    const layersDirPathes = getDirectories('/layers');

    // archive lambda layers folders
    await Promise.all(
      layersDirPathes.map(folderPath => {
        const pathFolders = folderPath.split('/');
        const name = pathFolders[pathFolders.length - 1];

        return archiveFolder(
          folderPath, 
          `${process.cwd()}/deploy/terraform/feature-resources/${name}-layer.cligenerated.zip`
        )
      })
    );
  },

  deploy: async ({ env, feature, infrastructure }) => {
    const lambdasDirPathes = getDirectories('/functions');

    await Promise.all([
      // copy env.json to lambda folder
      ...lambdasDirPathes.map(folderPath => copyFileToFilder('env.cligenerated.json', `${folderPath}/env.cligenerated.json`)),

      // copy infrastructure.json to lambdas folder
      ...lambdasDirPathes.map(folderPath => copyFileToFilder('infrastructure.cligenerated.json', `${folderPath}/infrastructure.cligenerated.json`)),

      // copy services.json to lambdas folder
      ...lambdasDirPathes.map(folderPath => copyFileToFilder('services.cligenerated.json', `${folderPath}/services.cligenerated.json`)),
    ]);

    // archive lambda functions folders
    const archives = await Promise.all(
      lambdasDirPathes.map(folderPath => archiveFolder(folderPath, `${folderPath}/__bundle__.cligenerated.zip`))
    );

    const lambdaClient = new LambdaClient({ region: 'eu-central-1' });
    const s3Client = new S3Client({ region: 'eu-central-1' });

    // upload lambdas zips to S3 bucket
    await Promise.all([
      ...archives.map(filePath => {
        const pathFolders = filePath.split('/');
        const name = pathFolders[pathFolders.length - 2];

        return uploadToS3({ 
          filePath, 
          s3Client,
          bucketName: infrastructure.globalResources.s3.bucketId,
          keyName: `${env}/${feature}/${name}.zip`, 
        });
      })
    ]);

    console.log('start updating lambdas')

    // Update lambdas code for newly uploaded zip archives
    await Promise.all([
      ...archives.map(filePath => {
        const pathFolders = filePath.split('/');
        const name = pathFolders[pathFolders.length - 2];

        return updateLambdaFunctionCode({ 
          lambdaClient,
          lambdaName: `${env}-${feature}-auth-api-${name}`,
          bucket: infrastructure.globalResources.s3.bucketId, 
          key: `${env}/${feature}/${name}.zip`, 
        });
      }),

      // remove all zip files
      ...archives.map(filePath => fsPromises.unlink(filePath))
    ]);

    console.log('end updating lambdas')
  } 
});