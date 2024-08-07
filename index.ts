// @ts-nocheck
const { Cluster } = require('puppeteer-cluster');
const puppeteer = require('puppeteer-extra');





(async () => {
  const StealthPlugin = require('puppeteer-extra-plugin-stealth')
puppeteer.use(StealthPlugin())
  // Launch Puppeteer Cluster
  const cluster = await Cluster.launch({
    concurrency: Cluster.CONCURRENCY_BROWSER,  // Use BROWSER concurrency to manage multiple tabs
    maxConcurrency: parseInt(process.env.PUPPETEER_MAX_CONCURRENCY || '5'), // Number of browsers to run simultaneously
    puppeteerOptions: {
      headless: false,  // Set to false if you want to see the browser actions
      defaultViewport: null,
      args: ['--no-sandbox', '--start-maximized',      "--disable-setuid-sandbox",    ],
      protocolTimeout: 1500000
    },
    monitor: true,  // Monitor performance
    timeout:1500000
  });

      

  // Task definition
  await cluster.task(async ({ page, data: urls }) => {
    await page.setDefaultNavigationTimeout(0);  // Disable navigation timeout
    await page.setDefaultTimeout(0);  // Disable all other timeouts

    await new Promise(async (resolve) => {

    // Launch a new browser instance manually
    try {
      const browser = await puppeteer.launch({
       dumpio: true,
       headless: false,  // Set to false to see the browser actions
       defaultViewport: null,
       args: ['--no-sandbox', '--start-maximized',      "--disable-setuid-sandbox",
       
      ],
      })

       // Create multiple tabs within the new browser instance
    for (const url of urls) {
      const newPage = await browser.newPage();  // Open a new tab in the new browser
      newPage.setDefaultNavigationTimeout(1500000)
      newPage.setDefaultTimeout(1500000)
      await newPage.setRequestInterception(true);
      
      newPage.on('request', (request) => {
            if (['image', 'stylesheet', 'font', 'media'].includes(request.resourceType())) {
              request.abort();
            } else {
              request.continue();
            }
      });

      await newPage.goto(url, {waitUntil:'domcontentloaded', timeout: 1500000});  // Navigate to the URL
      console.log(`Opened URL: ${url} in new tab`);
      console.log(`Page title: ${await newPage.title()}`);
      await newPage.content();
    }



    // Close all tabs and the browser instance after work is done
    await browser.close();

    resolve()
      } catch (error) {
          console.error(`Failed to launch browser instance: ${error.message}`);
      
      }

  });

  });

  for (let index = 0; index < parseInt(process.env.NUMBER_OF_TIMES_OPERATIONS || '500'); index++) {
    
  // Queue with multiple URLs per task (each array entry creates multiple tabs)
  cluster.queue(['https://blinkit.com/prn/anveshan-wood-cold-pressed-black-mustard-oil/prid/511771', 'https://blinkit.com/prn/anveshan-wood-cold-pressed-black-mustard-oil/prid/511771','https://blinkit.com/prn/anveshan-wood-cold-pressed-black-mustard-oil/prid/511771','https://blinkit.com/prn/anveshan-wood-cold-pressed-black-mustard-oil/prid/511771','https://blinkit.com/prn/anveshan-wood-cold-pressed-black-mustard-oil/prid/511771','https://blinkit.com/prn/anveshan-wood-cold-pressed-black-mustard-oil/prid/511771','https://blinkit.com/prn/anveshan-wood-cold-pressed-black-mustard-oil/prid/511771','https://blinkit.com/prn/anveshan-wood-cold-pressed-black-mustard-oil/prid/511771','https://blinkit.com/prn/anveshan-wood-cold-pressed-black-mustard-oil/prid/511771','https://blinkit.com/prn/anveshan-wood-cold-pressed-black-mustard-oil/prid/511771','https://blinkit.com/prn/anveshan-wood-cold-pressed-black-mustard-oil/prid/511771','https://blinkit.com/prn/anveshan-wood-cold-pressed-black-mustard-oil/prid/511771','https://blinkit.com/prn/anveshan-wood-cold-pressed-black-mustard-oil/prid/511771','https://blinkit.com/prn/anveshan-wood-cold-pressed-black-mustard-oil/prid/511771','https://blinkit.com/prn/anveshan-wood-cold-pressed-black-mustard-oil/prid/511771','https://blinkit.com/prn/anveshan-wood-cold-pressed-black-mustard-oil/prid/511771','https://blinkit.com/prn/anveshan-wood-cold-pressed-black-mustard-oil/prid/511771','https://blinkit.com/prn/anveshan-wood-cold-pressed-black-mustard-oil/prid/511771','https://blinkit.com/prn/anveshan-wood-cold-pressed-black-mustard-oil/prid/511771','https://blinkit.com/prn/anveshan-wood-cold-pressed-black-mustard-oil/prid/511771']);
 
}


  // Wait for the cluster to finish
  await cluster.idle();
  await cluster.close();
})();