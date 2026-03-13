const { BlobServiceClient } = require("@azure/storage-blob");

const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
const containerName = process.env.AZURE_STORAGE_CONTAINER;

const uploadToAzure = async (fileBuffer, fileName) => {

  const blobServiceClient =
    BlobServiceClient.fromConnectionString(connectionString);

  const containerClient =
    blobServiceClient.getContainerClient(containerName);

  const blockBlobClient =
    containerClient.getBlockBlobClient(fileName);

  await blockBlobClient.uploadData(fileBuffer);

  return blockBlobClient.url;
};

module.exports = uploadToAzure;