const { v4: uuidv4 } = require("uuid");
const client = require("../config/qdrant");

const COLLECTION_NAME = "pdf_chunks";
let collectionInitialized = false;

async function ensureCollection(vectorSize) {
  if (collectionInitialized) return;

  try {
    const collections = await client.getCollections();
    const exists = collections.collections.some(
      (collection) => collection.name === COLLECTION_NAME,
    );

    if (!exists) {
      await client.createCollection(COLLECTION_NAME, {
        vectors: {
          size: vectorSize,
          distance: "Cosine",
        },
      });
      console.log(`Collection ${COLLECTION_NAME} created`);
    }

    try {
      await client.createPayloadIndex(COLLECTION_NAME, {
        field_name: "documentId",
        field_schema: "keyword",
        wait: true,
      });
    } catch (error) {
      // Index may already exist
    }

    try {
      await client.createPayloadIndex(COLLECTION_NAME, {
        field_name: "userId",
        field_schema: "keyword",
        wait: true,
      });
    } catch (error) {
      // Index may already exist
    }

    collectionInitialized = true;
  } catch (error) {
    console.error("Failed to initialize Qdrant collection:", error.message);
    throw error;
  }
}

async function storeChunks(documentId, chunks, embeddings, userId = null) {
  if (!embeddings || embeddings.length === 0) {
    throw new Error("No embeddings provided");
  }

  if (chunks.length !== embeddings.length) {
    throw new Error("Chunks and embeddings length do not match");
  }

  const vectorSize = embeddings[0].length;

  await ensureCollection(vectorSize);

  const points = chunks.map((chunk, index) => ({
    id: uuidv4(),
    vector: embeddings[index],
    payload: {
      userId: userId ? String(userId) : null,
      documentId: String(documentId),
      chunkIndex: index,
      text: chunk,
    },
  }));

  // Upsert in smaller batches of 25 with retries to avoid payload limits and ECONNRESET timeouts
  const BATCH_SIZE = 25;
  for (let i = 0; i < points.length; i += BATCH_SIZE) {
    const batch = points.slice(i, i + BATCH_SIZE);
    let retries = 3;

    while (retries > 0) {
      try {
        await client.upsert(COLLECTION_NAME, {
          wait: true,
          points: batch,
        });
        break;
      } catch (upsertError) {
        retries--;
        const isNetworkErr =
          upsertError.cause?.code === "ECONNRESET" ||
          upsertError.message?.includes("fetch failed");

        if (retries > 0 && isNetworkErr) {
          console.warn(
            `Qdrant upsert batch failed (${upsertError.cause?.code || upsertError.message}), retrying... (${retries} retries left)`,
          );
          await new Promise((resolve) => setTimeout(resolve, 1000));
        } else {
          throw upsertError;
        }
      }
    }
  }

  console.log(`${points.length} chunks stored in Qdrant`);
}

async function searchChunks(
  queryEmbedding,
  documentId,
  userId = null,
  limit = 3,
) {
  const must = [
    {
      key: "documentId",
      match: {
        value: String(documentId),
      },
    },
  ];

  if (userId) {
    must.push({
      key: "userId",
      match: {
        value: String(userId),
      },
    });
  }

  const response = await client.query(COLLECTION_NAME, {
    query: queryEmbedding,
    limit,
    with_payload: true,
    filter: {
      must,
    },
  });

  const points = response.points || [];

  return points.map((point) => ({
    id: point.id,
    score: point.score,
    text: point.payload?.text || "",
    chunkIndex: point.payload?.chunkIndex,
  }));
}

async function deleteDocumentVectors(documentId, userId = null) {
  const must = [
    {
      key: "documentId",
      match: {
        value: String(documentId),
      },
    },
  ];

  if (userId) {
    must.push({
      key: "userId",
      match: {
        value: String(userId),
      },
    });
  }

  await client.delete(COLLECTION_NAME, {
    wait: true,
    filter: {
      must,
    },
  });

  console.log(`Vectors deleted for document ${documentId}`);
}

module.exports = {
  storeChunks,
  searchChunks,
  deleteDocumentVectors,
};
