# Connect durable media storage for Render uploads

The hero, product and partner upload endpoints use the existing S3-compatible storage integration. The reported upload error occurred with no media storage configured. A database connection or working SMTP does not provide image storage.

Configure a public media bucket on your S3-compatible provider, grant the server credentials object read/write access to that bucket, and add these server-only values in Render's Environment page:

```dotenv
S3_ACCESS_KEY=<provider access key ID>
S3_SECRET_KEY=<provider secret access key>
S3_REGION=<bucket region, or auto for R2>
S3_ENDPOINT=<provider HTTPS S3 API endpoint; leave unset for AWS S3>
COMMUNITY_BUCKET=<actual public media bucket name>
COMMUNITY_MEDIA_BASE_URL=<public HTTPS bucket or CDN URL, with no bucket key appended>
```

Use your provider's actual values; placeholders and the local MinIO defaults in `.env.example` will not work on Render. Save and redeploy after setting credentials. Keep private face images in a separate private `SCANS_BUCKET`.

For AWS S3, the standard public bucket URL can be used when `COMMUNITY_MEDIA_BASE_URL` is omitted. For Cloudflare R2, the S3 endpoint is `https://<account-id>.r2.cloudflarestorage.com`, region is `auto`, and a separate public media URL is required. The authenticated R2 S3 endpoint does not serve public images. Use a custom domain for production; the rate-limited `r2.dev` URL is intended for development. See [R2 S3 setup](https://developers.cloudflare.com/r2/get-started/s3/) and [R2 public buckets](https://developers.cloudflare.com/r2/buckets/public-buckets/).

The admin upload goes through the backend, so no browser S3 PUT is required for that flow. Direct community uploads use presigned PUTs and additionally require the bucket CORS settings to allow the storefront origin, PUT/GET/HEAD and Content-Type.

Run `npm run media:check` from `backend` with the configured environment where a shell is available. It checks setting names and performs a read-only HeadBucket call; it sends no images and does not prove object-write permission or anonymous image delivery. Missing configuration and rejected credentials/buckets are reported separately from temporary network failures. Logs omit provider response bodies and credentials.

Then upload one real image in **Hero presentation**, verify the displayed preview, and select **Publish editorial changes**. Confirm the image appears on the storefront and remains available after a deployment. New immutable media URLs carry a long cache lifetime. The normal Render filesystem is ephemeral, so production upload success requires object storage rather than a local-file fallback. See [Render filesystem persistence](https://render.com/docs/disks).

Until storage is connected, existing asset paths such as `/product_barrier_cream.jpg` can be entered in the formulation's **Direct Photo URL or Asset Path** field to test publishing separately. See [the formulation test inputs](FORMULATION_PUBLICATION_TEST.md).
