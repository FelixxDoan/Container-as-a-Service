import { minio } from '@micro/db/conn'

export function getChildrenFolder( folderPrefix, recursive = false, bucketName = 'students',) {
  return new Promise((resolve, reject) => {
    const stream = minio.listObjectsV2(bucketName, folderPrefix, recursive);
    const data = [];
    stream.on('data', function (obj) { data.push(obj) });
    stream.on('end', function () { resolve(data) });
    stream.on('error', function (err) { reject(err) });
  })
}

export async function getObjectStream(objectName, bucketName = 'students') {
  const stream = await minio.getObject(bucketName, objectName);
  return new Promise((resolve, reject) => {
    const data = [];
    stream.on('data', function (obj) { data.push(obj) });
    stream.on('end', function () { 
      resolve(Buffer.concat(data).toString('utf8')); 
    });
    stream.on('error', function (err) { reject(err) });
  })  
}
