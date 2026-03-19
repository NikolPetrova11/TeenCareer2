const puppeteer = require('puppeteer');
const fs = require('fs');
const cron = require('node-cron');

async function runScraper() {
    console.log("Scraping started at:", new Date().toLocaleString());
    
    // Read existing jobs to preserve manually added ones
    let existingJobs = [];
    const customJobs = [];
    
    try {
        if (fs.existsSync('./jobs.json')) {
            const fileContent = fs.readFileSync('./jobs.json', 'utf8');
            existingJobs = JSON.parse(fileContent);
            
            // Filter out jobs that were manually added (those with custom property)
            existingJobs.forEach(job => {
                if (job.custom === true) {
                    customJobs.push(job);
                }
            });
        }
    } catch (error) {
        console.log("Could not read existing jobs:", error.message);
    }
    
    // Launch Puppeteer
    const browser = await puppeteer.launch({ headless: "new" }); 
    const page = await browser.newPage();
    
    const targetUrl = 'https://www.jobs.bg/front_job_search.php?categories%5B%5D=56';
    
    try {
        await page.goto(targetUrl, { waitUntil: 'networkidle2' });

        // Extract jobs 
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
                    experience: 0
                };
            });
        });

        // Merge scraped jobs with custom jobs (custom jobs first)
        const allJobs = [...customJobs, ...jobs];
        
        // Save to jobs.json
        fs.writeFileSync('./jobs.json', JSON.stringify(allJobs, null, 2));
        
        console.log(`Successfully scraped ${jobs.length} jobs and preserved ${customJobs.length} custom jobs!`);
    } catch (error) {
        console.error("Scraping failed:", error);
    } finally {
        await browser.close();
    }
}

// Schedule scraper to run daily at 9 AM
cron.schedule('0 9 * * *', () => {
    runScraper();
});

// Only run scraper on startup if jobs.json doesn't exist
if (!fs.existsSync('./jobs.json')) {
    console.log("jobs.json not found, running scraper...");
    runScraper();
} else {
    console.log("jobs.json already exists, skipping initial scrape. Will run at scheduled time.");
}