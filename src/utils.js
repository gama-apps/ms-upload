// const AWS = require('aws-sdk')
const { Upload } = require("@aws-sdk/lib-storage")
const { S3 } = require("@aws-sdk/client-s3")
const utils = {};
const { nameSanitizer, generateRandomFileName } = require('@codecraftkit/utils');
const url = require('url');


// AWS.config.update({
//   accessKeyId: process.env.AMAZON_ACCESS_KEY_ID,
//   secretAccessKey: process.env.AMAZON_SECRET_ACCESS_KEY,
//   region: process.env.AMAZON_REGION
// });

/**
 * Para validacion y evitar que se creen folders randoms
 */

utils.paths = [
  'books',
  'bookcovers',
  'rocket_store_product',
  'rocket_store_campaign',
  'market_product',
  'n_link',
  'posts',
  'campaign_leaderboard',
  'access',
  'fa_cdi_product',
  'fa_cdi_campaign',
  'avatar_pieces',
  'avatar_categories',
  'avatar_users',
  'user_profile_pictures',
  'market_comment',
  'user_business_pictures',
  'market_news',
  'support_documents',
  'market_campaign_banners',
  'market_restaurant_pictures',
  'support_project'
];

/**
 * This function receives the file argument and uploads it to the cloud
 *
 * @param session
 * @type Object
 * @param config
 * @type Object
 * @returns {Promise<unknown>}
 */
utils.uploadToAmazon = (session, config) => {
  return new Promise(async (resolve, reject) => {
    try {
      const { path, file, agencyId, bucket: Bucket = process.env.AMAZON_BUCKET, fnResval } = config;
      let original = nameSanitizer(file.originalname);

      if (config.uniqueName) original = generateRandomFileName(original);


      const fileName = original;
      const folder = process.env.DEBUG.trim() === 'true' ? process.env.DEV_FOLDER : process.env.PRODUCTION_FOLDER;
      const key = `${folder}/${agencyId}/${path}/${fileName}`;

      let tempFile = {
        fileName,
        originalName: file.originalname,
        fileType: file.mimetype,
        size: file.size
      };

      const params = {
        Bucket,
        Key: key,
        Body: file.buffer,
        ACL: 'public-read', // comentar esta linea cuando se comienze a usar el download
        ContentDisposition: `inline; filename="${file.originalname}"`,
        ContentType: file.mimetype
      };

      // S3 ManagedUpload with callbacks are not supported in AWS SDK for JavaScript (v3).
      // Please convert to `await client.upload(params, options).promise()`, and re-run aws-sdk-js-codemod.
      // s3.upload(params, function (err, data) {
      //   if (err) {
      //     reject(err);
      //   } else {
      //     tempFile.url = `${process.env.AMAZON_URL_VIEW}${key}`;
      //     tempFile.ETag = JSON.parse(data.ETag);
      //     if (process.env.DEBUG.trim() === "true") {
      //       console.log("Successfully uploaded file", tempFile);
      //     }
      //     resolve(tempFile);
      //   }
      // });

      const s3 = new S3({
        region: process.env.AMAZON_REGION,
        credentials: {
          accessKeyId: process.env.AMAZON_ACCESS_KEY_ID,
          secretAccessKey: process.env.AMAZON_SECRET_ACCESS_KEY,
        }
      });

      const upload = new Upload({ client: s3, params })
      const data = await upload.done()
      tempFile.url = `${process.env.AMAZON_URL_VIEW}${key}`;
      tempFile.ETag = JSON.parse(data.ETag);
      if (process.env.DEBUG.trim() === "true") {
        console.log("Successfully uploaded file", tempFile);
      }
      resolve(tempFile);

    } catch (error) {
      reject(error)
    }
  });
};

utils.downloadToAmazon = async ({ aws_url }) => {
  try {
    const { pathname } = url.parse(String(aws_url));

    const params = {
      Bucket: process.env.AMAZON_BUCKET, // Nombre del bucket
      Key: pathname.substring(1), // Clave del archivo en el bucket
    }

    const s3 = new S3({
      region: process.env.AMAZON_REGION,
      credentials: {
        accessKeyId: process.env.AMAZON_ACCESS_KEY_ID,
        secretAccessKey: process.env.AMAZON_SECRET_ACCESS_KEY,
      }
    });

    return await s3.getObject(params)
  } catch (e) {
    console.error(e)
  }
}

module.exports = utils;
