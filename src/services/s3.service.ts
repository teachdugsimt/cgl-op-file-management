
// import AWS from 'aws-sdk';
// // import * as S3 from 'aws-sdk/clients/s3';
// // import * as S3 from '@aws-sdk/client-s3';

// import { Observable, of } from 'rxjs';


// export class FileUpload {
//   name: string;
//   url: string;
//   result: any[] | undefined;

//   constructor(name: string, url: string) {
//     this.name = name;
//     this.url = url;
//     // this.result = []
//   }
// }

// export default class S3Controller {
//   FOLDER = 'VEHICLE_IMAGE/FRONT/INPROGRESS'; // For example, 'my_folder'.
//   BUCKET = 'cargolink-documents'; // For example, 'my_bucket'.

//   private static getS3Bucket(): any {
//     return new AWS.S3(
//       {
//         // accessKeyId: '/* access key here */', // For example, 'AKIXXXXXXXXXXXGKUY'.
//         // secretAccessKey: '/* secret key here */', // For example, 'm+XXXXXXXXXXXXXXXXXXXXXXDDIajovY+R0AGR'.
//         region: 'ap-southeast-1' // For example, 'us-east-1'.
//       }
//     );
//   }

//   public uploadFile(file) {
//     const bucket = new AWS.S3(
//       {
//         accessKeyId: '/* access key here */',
//         secretAccessKey: '/* secret key here */',
//         region: '/* region here */'
//       }
//     );

//     const params = {
//       Bucket: this.BUCKET,
//       Key: this.FOLDER + file.name,
//       Body: file,
//       ACL: 'public-read'
//     };

//     bucket.upload(params, function (err, data) {
//       if (err) {
//         console.log('There was an error uploading your file: ', err);
//         return false;
//       }
//       console.log('Successfully uploaded file.', data);
//       return true;
//     });
//   }

//   public getFiles(): Observable<Array<FileUpload>> {
//     const fileUploads: any[] = [];

//     const params = {
//       Bucket: this.BUCKET,
//       Prefix: this.FOLDER
//     };

//     S3Controller.getS3Bucket().listObjects(params, function (err, data) {
//       if (err) {
//         console.log('There was an error getting your files: ' + err);
//         return;
//       }
//       console.log('Successfully get files.', data);

//       const fileDetails = data.Contents;

//       fileDetails.forEach((file) => {
//         fileUploads.push(new FileUpload(file.Key,
//           'https://s3.amazonaws.com/' + params.Bucket + '/' + file.Key));
//       });
//     });

//     return of(fileUploads);
//   }

//   public deleteFile(file: FileUpload) {
//     const params = {
//       Bucket: this.BUCKET,
//       Key: file.name
//     };

//     S3Controller.getS3Bucket().deleteObject(params, (err, data) => {
//       if (err) {
//         console.log('There was an error deleting your file: ', err.message);
//         return;
//       }
//       console.log('Successfully deleted file.');
//     });
//   }
// }
// // snippet-end:[s3.typescript.controller]





// // import 'aws-sdk/lib/node_loader'; // Hack needed before the first import
// // import { config } from 'aws-sdk/lib/core'; // or any other `aws-sdk` export
// import S3 from 'aws-sdk/clients/s3';
// import { ManagedDownloader, GetObjectStreamInput, ManagedDownloaderOptions } from '@aws/s3-managed-downloader';
// import * as fs from 'fs';
// import { FastifyReply } from 'fastify';

// export const streamDowloader = async (reply: FastifyReply) => {

//   const s3: S3 = new S3();
//   const managedDownloader: ManagedDownloader = new ManagedDownloader(s3);

//   const params: GetObjectStreamInput = {
//     Bucket: 'cargolink-documents',
//     Key: 'VEHICLE_IMAGE/FRONT/INPROGRESS/VEHICLE_IMAGE-FRONT-1624969284810.PNG'
//   };

//   // create a write stream for a file
//   const writeStream = fs.createWriteStream('./tmp');

//   await managedDownloader.getObjectStream(params)
//     .then((stream) => {
//       console.log("Streeam :: ", stream)
//       stream.pipe(writeStream);
//       reply.status(200).send({ status: true })
//     }, (err) => {
//       writeStream.end();
//       console.error(err);
//     })
// }



