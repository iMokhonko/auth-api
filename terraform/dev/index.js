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
  serviceName: 'Auth API',

  config: {
    env: 'dev', // infrastructure environment
    hostedZone: 'imokhonko.com', // hosted zone where DNS records will be created
    subdomain: 'auth-api', // service subdomain
  },

  aws: {
    region: 'us-east-1', // aws region
    profile: 'default', // aws credentials profile in .aws/credentials file
  },

  terraformBackend: {
    serviceName: 'auth-api', // backend service name
    bucket: 'tf-state-backend-imokhonko', // aws bucket name where tfstate files will be stored
    region: 'us-east-1' // bucket region in aws
  },

  terraformResources: [
    // Create DynamoDB table for users
    {
      folderName: "database",
      outputName: "database",

      global: true
    },

    // Create KMS key for encrypting users passwords
    {
      folderName: "kms",
      outputName: "kms",

      global: true
    },

    // Create S3 bucket for uploading lambdas code (as zip archive)
    {
      folderName: "s3",
      outputName: "s3",

      global: true
    },

    // Create DNS records for this services in route 53 and create ACM certificates
    {
      folderName: "dns",
      outputName: "dns",

      global: true
    },

    // Create config record about this service in AWS Parameter Store
    {
      folderName: "config",
      outputName: "config",

      global: true
    },

    // Create API gateway for this service
    {
      folderName: "api-gw",
      description: "Create API Gateway",

      outputName: "api_gw",

      global: true
    },

    // Create secret for JWT tokens
    {
      folderName: "secrets-manager",
      description: "Create JWT secret for users JWT tokens",

      outputName: "secrets_manager",

      global: true
    },

    // Create API Gateway stage to deploy api
    {
      folderName: "api-gw-stage",
      description: "Create API Gateway Stage",

      outputName: "api_gw_stage"
    },

    // Create lambda functions
    {
      folderName: "lambdas",
      description: "Create lambda functions",

      outputName: "lambdas"
    },

    // Setup integrations between Lambda and API Gateway
    {
      folderName: "integrations",
      description: "Create integration between Api Gateway and lambdas",

      outputName: "integration"
    },

    // Create cloudfront distribution for API Gateway and use domain name as alias for this distribution
    {
      folderName: "cloudfront_distribution",
      description: "Create distribution for API for current env & feature",

      outputName: "distribution"
    }
  ],
  
  deploy: async ({ env, feature, infrastructure, AWS, config }) => {
    const lambdasDirPathes = getDirectories('/functions');

    await Promise.all([
      // copy env.json to lambda folder
      ...lambdasDirPathes.map(folderPath => copyFileToFilder('env.json', `${folderPath}/env.json`)),

      // copy infrastructure.json to lambdas folder
      ...lambdasDirPathes.map(folderPath => copyFileToFilder('infrastructure.json', `${folderPath}/infrastructure.json`))
    ]);

    // archive lambda functions folders
    const archives = await Promise.all(
      lambdasDirPathes.map(folderPath => archiveFolder(folderPath, `${folderPath}/__bundle__.zip`))
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
          bucketName: infrastructure.s3.s3_bucket_id, 
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
          lambdaName: `${env}-${feature}-${name}`,
          bucket: infrastructure.s3.s3_bucket_id, 
          key: `${env}/${feature}/${name}.zip`, 
        });
      })
    ]);
  } 

});