import { CopyObjectCommand, ListObjectsV2Command } from "@aws-sdk/client-s3";
import { DocumentStorageType } from "@prisma/client";
import { put } from "@vercel/blob";
import { match } from "ts-pattern";

import { newId } from "@/lib/id-helper";

import { getS3Client } from "./aws-client";

export const copyFileServer = async ({
  teamId,
  filePath,
  fileName,
  storageType,
}: {
  teamId: string;
  filePath: string;
  fileName: string;
  storageType: DocumentStorageType;
}) => {
  const { type, data } = await match(storageType)
    .with("S3_PATH", async () => copyFileInS3Server({ teamId, filePath }))
    .with("VERCEL_BLOB", async () =>
      copyFileInVercelServer({ fileName, fileUrl: filePath }),
    )
    .otherwise(() => {
      return {
        type: null,
        data: null,
      };
    });

  return { type, data };
};

const copyFileInVercelServer = async ({
  fileName,
  fileUrl,
}: {
  fileName: string;
  fileUrl: string;
}) => {
  const file = await fetch(fileUrl);
  const contents = await file.arrayBuffer();
  const newFileName = fileName + "-copy";

  const blob = await put(newFileName, contents, {
    access: "public",
  });

  return {
    type: DocumentStorageType.VERCEL_BLOB,
    data: { fromLocation: fileUrl, toLocation: blob.url },
  };
};

const copyFileInS3Server = async ({
  teamId,
  filePath,
}: {
  teamId: string;
  filePath: string;
}) => {
  // Get the current document ID from the file path
  const fromDocId = filePath.match(/doc_\w+/)?.[0];
  // Generate a new document ID for copied document prefix
  const toDocId = newId("doc");

  if (!fromDocId) {
    throw new Error("Invalid file ID");
  }

  const fromLocation = `${teamId}/${fromDocId}/`;
  const toLocation = `${teamId}/${toDocId}/`;

  const response = await copyFolder({
    fromBucket: process.env.NEXT_PRIVATE_UPLOAD_BUCKET as string,
    fromLocation: fromLocation,
    toBucket: process.env.NEXT_PRIVATE_UPLOAD_BUCKET as string,
    toLocation: toLocation,
  });

  console.log("response", response);

  return {
    type: DocumentStorageType.S3_PATH,
    data: { fromLocation, toLocation },
  };
};

// copies all items in a folder on s3
async function copyFolder({
  fromBucket,
  fromLocation,
  toBucket = fromBucket,
  toLocation,
}: {
  fromBucket: string;
  fromLocation: string;
  toBucket: string;
  toLocation: string;
}) {
  const client = getS3Client();
  let count = 0;
  const recursiveCopy = async function (token?: string) {
    const listCommand = new ListObjectsV2Command({
      Bucket: fromBucket,
      Prefix: fromLocation,
      ContinuationToken: token,
    });
    let list = await client.send(listCommand); // get the list
    if (list.KeyCount && list.Contents) {
      // if items to copy
      const fromObjectKeys = list.Contents.map((content) => content.Key); // get the existing object keys
      for (let fromObjectKey of fromObjectKeys) {
        // loop through items and copy each one
        const toObjectKey = fromObjectKey?.replace(fromLocation, toLocation); // replace with the destination in the key
        // copy the file
        const copyCommand = new CopyObjectCommand({
          Bucket: toBucket,
          CopySource: `${fromBucket}/${fromObjectKey}`,
          Key: toObjectKey,
        });
        await client.send(copyCommand);
        count += 1;
      }
    }
    if (list.NextContinuationToken) {
      recursiveCopy(list.NextContinuationToken);
    }
    return `${count} files copied.`;
  };
  return recursiveCopy();
}
