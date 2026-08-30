const { QdrantClient } = require("@qdrant/js-client-rest");
const { v4: uuidv4 } = require("uuid");
const config = require("../config/env");

const COLLECTION_NAME = "pdf_chunks";

const client = new QdrantClient({
    url: config.qdrantUrl,
    apiKey: config.qdrantApiKey
});


async function ensureCollection(vectorSize) {
    const collections = await client.getCollections();

    const exists = collections.collections.some(
        collection => collection.name === COLLECTION_NAME
    );

    if (!exists) {
        await client.createCollection(
            COLLECTION_NAME,
            {
                vectors: {
                    size: vectorSize,
                    distance: "Cosine"
                }
            }
        );

        console.log(`Collection ${COLLECTION_NAME} created`);
    }

    try {
        await client.createPayloadIndex(
            COLLECTION_NAME,
            {
                field_name: "documentId",
                field_schema: "keyword",
                wait: true
            }
        );
    } catch (error) {
        // Index may already exist
    }
}


async function storeChunks(
    documentId,
    chunks,
    embeddings
) {
    if (!embeddings || embeddings.length === 0) {
        throw new Error("No embeddings provided");
    }

    if (chunks.length !== embeddings.length) {
        throw new Error(
            "Chunks and embeddings length do not match"
        );
    }

    const vectorSize = embeddings[0].length;

    await ensureCollection(vectorSize);

    const points = chunks.map(
        (chunk, index) => ({
            id: uuidv4(),

            vector: embeddings[index],

            payload: {
                documentId: String(documentId),
                chunkIndex: index,
                text: chunk
            }
        })
    );

    await client.upsert(
        COLLECTION_NAME,
        {
            wait: true,
            points
        }
    );

    console.log(
        `${points.length} chunks stored in Qdrant`
    );
}


async function searchChunks(
    queryEmbedding,
    documentId,
    limit = 5
) {
    const response = await client.query(
        COLLECTION_NAME,
        {
            query: queryEmbedding,
            limit,
            with_payload: true,
            filter: {
                must: [
                    {
                        key: "documentId",
                        match: {
                            value: String(documentId)
                        }
                    }
                ]
            }
        }
    );

    const points = response.points || [];

    return points.map(point => ({
        id: point.id,
        score: point.score,
        text: point.payload?.text || "",
        chunkIndex: point.payload?.chunkIndex
    }));
}


async function deleteDocumentVectors(documentId) {
    await client.delete(
        COLLECTION_NAME,
        {
            wait: true,

            filter: {
                must: [
                    {
                        key: "documentId",
                        match: {
                            value: String(documentId)
                        }
                    }
                ]
            }
        }
    );

    console.log(
        `Vectors deleted for document ${documentId}`
    );
}


module.exports = {
    storeChunks,
    searchChunks,
    deleteDocumentVectors
};
