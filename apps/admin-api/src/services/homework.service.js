import { minio } from '@micro/db/conn'

export function getChildrenFolder(bucketName = 'students', folderPrefix, recursive = false) {
  return new Promise((resolve, reject) => {
    const stream = minio.listObjectsV2(bucketName, folderPrefix, recursive);
    const data = [];
    stream.on('data', function (obj) { data.push(obj) });
    stream.on('end', function () { resolve(data) });
    stream.on('error', function (err) { reject(err) });
  })
}

export async function getObjectStream(bucketName = 'students', objectName) {
  const stream = await minio.getObject(bucketName, objectName);
  return new Promise((resolve, reject) => {
    const data = [];
    stream.on('data', function (obj) { data.push(obj) });
    stream.on('end', function () { 
      // Convert buffer array to single string for JSON
      resolve(Buffer.concat(data).toString('utf8')); 
    });
    stream.on('error', function (err) { reject(err) });
  })  
}
