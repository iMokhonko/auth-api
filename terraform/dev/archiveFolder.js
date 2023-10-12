const fs = require('fs');
const archiver = require('archiver');
const util = require('util')

const streamFinished = util.promisify(require('stream').finished);

module.exports = async (folderPath, outputPath) => {
  const output = fs.createWriteStream(outputPath); 
  const archive = archiver('zip', {zlib: { level: 9 }}); 

  output.on('close', () => {
      console.log(archive.pointer() + ' total bytes');
      console.log('archiver has been finalized and the output file descriptor has closed.');
  });

  archive.on('error', (err) => {
      throw err;
  });

  archive.pipe(output);

  archive.directory(folderPath, false);

  archive.finalize();

  await streamFinished(output);

  return outputPath;
}