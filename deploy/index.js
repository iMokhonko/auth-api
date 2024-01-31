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
});