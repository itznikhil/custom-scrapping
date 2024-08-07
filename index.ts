// @ts-nocheck
const { Cluster } = require('puppeteer-cluster');
const puppeteer = require('puppeteer-extra');




(async () => {
  const StealthPlugin = require('puppeteer-extra-plugin-stealth')
puppeteer.use(StealthPlugin())
  // Launch Puppeteer Cluster
  const cluster = await Cluster.launch({
    concurrency: Cluster.CONCURRENCY_BROWSER,  // Use BROWSER concurrency to manage multiple tabs
    maxConcurrency: 100, // Number of browsers to run simultaneously
    puppeteerOptions: {
      headless: false,  // Set to false if you want to see the browser actions
      defaultViewport: null,
      args: ['--no-sandbox', '--start-maximized',      "--disable-setuid-sandbox",    ],
    },
    monitor: true,  // Monitor performance
  });

  // Task definition
  await cluster.task(async ({ page, data: urls }) => {
    // Launch a new browser instance manually
    const browser = await puppeteer.launch({
      headless: false,  // Set to false to see the browser actions
      defaultViewport: null,
      args: ['--no-sandbox', '--start-maximized',      "--disable-setuid-sandbox",
    ],
    });

    // Create multiple tabs within the new browser instance
    const pages = [];
    for (const url of urls) {
      const newPage = await browser.newPage();  // Open a new tab in the new browser
      await newPage.goto(url);  // Navigate to the URL
      console.log(`Opened URL: ${url} in new tab`);
      pages.push(newPage);  // Store the tab reference
    }

    // Example: Perform actions on each tab
    for (const newPage of pages) {
      console.log(`Page title: ${await newPage.title()}`);
      await newPage.content();
    }

    // Close all tabs and the browser instance after work is done
    await browser.close();
  });

  for (let index = 0; index < 500; index++) {
    
  // Queue with multiple URLs per task (each array entry creates multiple tabs)
  cluster.queue(['https://example.com', 'https://google.com','https://github.com', 'https://stackoverflow.com','https://twitter.com', 'https://facebook.com','https://blinkit.com', 'https://zeptonow.com','https://swiggy.com', 'https://zomato.com','https://olacabs.com', 'https://www.uber.com/in/en/','https://unicommerce.com', 'https://bytecubetech.com','https://muul.us', 'https://fillflow.us/login','https://whatsapp.com', 'https://chatgpt.com']);
 
}


  // Wait for the cluster to finish
  await cluster.idle();
  await cluster.close();
})();
