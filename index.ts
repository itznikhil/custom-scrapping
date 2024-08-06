// @ts-nocheck
const { Cluster } = require('puppeteer-cluster');
const puppeteer = require('puppeteer-extra');

(async () => {
  // Launch Puppeteer Cluster
  const cluster = await Cluster.launch({
    concurrency: Cluster.CONCURRENCY_BROWSER,  // Use PAGE concurrency to manage multiple tabs
    maxConcurrency: 5, // Number of tabs to run simultaneously (adjust as needed)
    puppeteerOptions: {
      headless: false,  // Set to false if you want to see the browser actions
    },
    monitor: true,  // Monitor performance
  });

  // Task definition
  await cluster.task(async ({ page, data: urls }) => {
    // Create multiple tabs within the same context
    const pages = [];
    for (const url of urls) {
      const newPage = await page.browser().newPage();  // Open a new tab
      await newPage.goto(url);  // Navigate to the URL
      console.log(`Opened URL: ${url} in new tab`);
      pages.push(newPage);  // Store the tab reference
    }

    // Example: Perform actions on each tab
    for (const newPage of pages) {
      console.log(`Page title: ${await newPage.title()}`);
      await newPage.screenshot({ path: `screenshot-${Date.now()}.png` });
    }

    // Close all tabs after work is done
    for (const newPage of pages) {
      await newPage.close();
    }
  });

  // Queue with multiple URLs per task (each array entry creates multiple tabs)
  cluster.queue(['https://example.com', 'https://google.com']);
  cluster.queue(['https://github.com', 'https://stackoverflow.com']);
  cluster.queue(['https://twitter.com', 'https://facebook.com']);

  cluster.queue(['https://blinkit.com', 'https://zeptonow.com']);
  cluster.queue(['https://swiggy.com', 'https://zomato.com']);
  cluster.queue(['https://olacabs.com', 'https://www.uber.com/in/en/']);

  cluster.queue(['https://unicommerce.com', 'https://bytecubetech.com']);
  cluster.queue(['https://muul.us', 'https://fillflow.us/login']);
  cluster.queue(['https://whatsapp.com', 'https://chatgpt.com']);

  // Wait for the cluster to finish
  await cluster.idle();
  await cluster.close();
})();
