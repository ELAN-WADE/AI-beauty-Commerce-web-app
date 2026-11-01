import '../src/lib/load-env';
import { HeadBucketCommand } from '@aws-sdk/client-s3';
import { publicMediaConfigurationStatus, mediaStorageFailure } from '../src/lib/media-storage';
import { s3, communityBucket } from '../src/lib/storage';

const status = publicMediaConfigurationStatus();
console.log(JSON.stringify({ scope: 'media-storage', ...status }));
if (!status.configured) process.exitCode = 1;
else {
  try {
    await s3().send(new HeadBucketCommand({ Bucket: communityBucket() }), { abortSignal: AbortSignal.timeout(15000) });
    console.log(JSON.stringify({ scope: 'media-storage', bucketAccessible: true, writeTest: false, publicReadTest: false }));
  } catch (error) {
    const failure = mediaStorageFailure(error);
    console.error(JSON.stringify({ scope: 'media-storage', code: failure.code, bucketAccessible: false }));
    process.exitCode = 1;
  } finally { s3().destroy(); }
}
