import { NextResponse } from 'next/server';
import { scrapeRateMyProfessor } from '@/utils/scraper';
import { insertIntoPinecone } from '@/utils/pinecone';

export async function POST(request) {
  try {
    const { url } = await request.json();
    console.log('Received URL:', url);

    console.log('Starting scraping...');
    const scrapedData = await scrapeRateMyProfessor(url);
    console.log('Scraped data:', scrapedData);

    console.log('Inserting into Pinecone...');
    await insertIntoPinecone(scrapedData);
    console.log('Data inserted into Pinecone');

    return NextResponse.json({ 
      success: true, 
      message: 'Data scraped and inserted successfully', 
      professorData: scrapedData
    });
  } catch (error) {
    console.error('Error in scrape-and-insert:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'An error occurred while processing the request'
    }, { status: 500 });
  }
}