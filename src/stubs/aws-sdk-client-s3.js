class FakeCommand {
  constructor() {}
}

class FakeS3Client {
  async send() {
    throw new Error('AWS S3 client is disabled during build (SKIP_AWS=1).');
  }
}

module.exports = {
  S3Client: FakeS3Client,
  PutObjectCommand: FakeCommand,
  GetObjectCommand: FakeCommand,
};
