
const jwt = require('jsonwebtoken');

module.exports =  (token = '', secretKey = '') => {
  try {
    if(!token || !secretKey) {
      return {
        isValid: false
      };
    }

    const decoded = jwt.verify(token, secretKey);

    return {
      isValid: true,
      decoded
    };
  } catch (err) {
    return {
      isValid: false
    };
  }
};