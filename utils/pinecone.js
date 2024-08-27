import { Pinecone } from '@pinecone-database/pinecone';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY,
});

async function convertToVector(data) {
  if (typeof data !== 'string') {
    throw new Error('Data should be a string for vector conversion.');
  }

  try {
    console.log('Creating embedding with OpenAI...');
    const response = await openai.embeddings.create({
      model: "text-embedding-ada-002",
      input: data,
    });
    console.log('Embedding created successfully');
    return response.data[0].embedding;
  } catch (error) {
    console.error('Error creating embedding:', error);
    throw error;
  }
}

export async function insertIntoPinecone(data) {
  try {
    console.log('Data before vector conversion:', data);

    console.log('Converting data to vector...');
    const vector = await convertToVector(JSON.stringify(data));
    console.log('Data converted to vector');

    const indexName = process.env.PINECONE_INDEX_NAME;

    if (!indexName) {
      throw new Error('Pinecone index name is not set in environment variables');
    }

    const index = pinecone.Index(indexName);

    console.log('Inserting vector into Pinecone...');

    const upsertResponse = await index.upsert([
      {
        id: `professor_${Date.now()}`,
        values: vector,
        metadata: data,
      },
    ]);

    console.log('Upsert response:', upsertResponse);
    console.log('Vector inserted successfully');
  } catch (error) {
    console.error('Error in insertIntoPinecone:', error);
    throw new Error(`Failed to insert data into Pinecone: ${error.message}`);
  }
}