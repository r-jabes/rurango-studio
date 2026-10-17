export type StoredObject = {
  key: string;
  byteSize: number;
};

export type StorageDriver = {
  putObject: (input: {
    key: string;
    body: Buffer;
    contentType: string;
  }) => Promise<StoredObject>;
  getObject: (key: string) => Promise<{
    body: Buffer;
    contentType?: string;
  }>;
  deleteObject: (key: string) => Promise<void>;
};
