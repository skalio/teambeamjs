export const constants = {
  initialChunkSize: 1000 * 1000 * 50, // 50MB
  maxChunkSize: 500 * 1000 * 1000, // 500 MB
  idealChunkUploadDuration: 60, // 60 seconds
  maxUploadRetries: 10,
  maxDelayBetweenRetriesSec: 20, // 20 seconds
} as const;
