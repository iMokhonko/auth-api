const fs = require('fs');
const util = require('util');

const copyFile = util.promisify(fs.copyFile);

module.exports = async (sourcePath, destinationPath) => {
  try {
    await copyFile(sourcePath, destinationPath);
  } catch (err) {
    console.error('An error occurred when copying file:', err);
  }
}