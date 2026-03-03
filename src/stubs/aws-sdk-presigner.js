async function getSignedUrl() {
  throw new Error('AWS S3 presigner is disabled during build (SKIP_AWS=1).');
}

module.exports = { getSignedUrl };
