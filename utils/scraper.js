import puppeteer from 'puppeteer';

export async function scrapeRateMyProfessor(url) {
  let browser;
  try {
    console.log('Initializing browser...');
    browser = await puppeteer.launch();
    const page = await browser.newPage();
    console.log('Navigating to URL:', url);
    await page.goto(url, { waitUntil: 'networkidle0' });

    // Wait for the name element to be visible
    await page.waitForSelector('[class*="NameTitle__Name"]', { visible: true, timeout: 5000 });

    console.log('Extracting data from page...');
    const professorData = await page.evaluate(() => {
      const name = document.querySelector('[class*="NameTitle__Name"]')?.textContent.trim();
      const department = document.querySelector('[class*="NameTitle__Title"]')?.textContent.trim();
      const rating = document.querySelector('[class*="RatingValue__Numerator"]')?.textContent.trim();
      const wouldTakeAgainElement = document.querySelector('[class*="FeedbackItem__FeedbackNumber"]');
      const wouldTakeAgain = wouldTakeAgainElement ? wouldTakeAgainElement.textContent.trim().replace('%', '') : null;
      const difficultyElement = document.querySelectorAll('[class*="FeedbackItem__FeedbackNumber"]')[1];
      const levelOfDifficulty = difficultyElement ? difficultyElement.textContent.trim() : null;

      const topRatings = Array.from(document.querySelectorAll('[class*="Comments__StyledComments"] [class*="Comments__Comment"]'))
        .slice(0, 3)
        .map(comment => comment.textContent.trim());

      return {
        name: name || 'Name not available',
        department: department || 'Department not available',
        overallRating: rating,
        wouldTakeAgainPercent: wouldTakeAgain,
        levelOfDifficulty,
        topRatings
      };
    });

    console.log('Scraped data:', professorData);
    return professorData;
  } catch (error) {
    console.error('Error during scraping:', error);
    throw error;
  } finally {
    await browser.close();
  }
}