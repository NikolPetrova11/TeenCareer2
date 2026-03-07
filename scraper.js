const puppeteer = require('puppeteer'); // Change this from playwright
const fs = require('fs');
const cron = require('node-cron');

async function runScraper() {
    console.log("Scraping started at:", new Date().toLocaleString());
    
    // Launch Puppeteer
    const browser = await puppeteer.launch({ headless: "new" }); 
    const page = await browser.newPage();
    
    const targetUrl = 'https://www.jobs.bg/front_job_search.php?categories%5B%5D=56';
    
    try {
        await page.goto(targetUrl, { waitUntil: 'networkidle2' });

        // Extract jobs using Puppeteer syntax
        const jobs = await page.evaluate(() => {
            const cards = Array.from(document.querySelectorAll('.mdc-card'));
            return cards.map(card => {
                const titleLink = card.querySelector('a.job-link');
                const company = card.querySelector('.description-view .company-name');
                const location = card.querySelector('.description-view .card-subtitle');
                
                return {
                    title: titleLink ? titleLink.innerText.trim() : 'No Title',
                    link: titleLink ? titleLink.href : '',
                    company: company ? company.innerText.trim() : 'Private Company',
                    city: location ? location.innerText.trim() : 'Bulgaria',
                    experience: 0 // Default for teen jobs
                };
            });
        });

        // Save to public folder
        fs.writeFileSync('./jobs.json', JSON.stringify(jobs, null, 2));
        
        console.log(`Successfully scraped ${jobs.length} jobs!`);
    } catch (error) {
        console.error("Scraping failed:", error);
    } finally {
        await browser.close();
    }
}

// Schedule: Run every day at 09:00 AM
cron.schedule('0 9 * * *', () => {
    runScraper();
});

// Run once immediately when starting the server
runScraper();