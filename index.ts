import { Browser, PuppeteerLaunchOptions } from "puppeteer";
import { PuppeteerExtra } from "puppeteer-extra";
import { Cluster } from "puppeteer-cluster";



const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));


export const handler = async (
 
) => {
  try {
    const puppeteer: PuppeteerExtra = require("puppeteer-extra");
    const stealthPlugin = require("puppeteer-extra-plugin-stealth");
    puppeteer.use(stealthPlugin());
    


    const cluster = await Cluster.launch({
      concurrency: Cluster.CONCURRENCY_CONTEXT,
      maxConcurrency: 10,
      puppeteer,
      puppeteerOptions:{      
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      }
    });

    for (let index = 0; index < 10; index++) {
      
      cluster.queue( async () => {

        try {
          const launchOptions: PuppeteerLaunchOptions = {
              headless: false,
              executablePath: puppeteer.executablePath(),
              args: [
                "--no-sandbox",
                "--disable-setuid-sandbox",
                "--incognito",
                "--disable-client-side-phishing-detection",
                "--disable-software-rasterizer",
                "--start-maximized"
              ],
            };
    
        const browser: Browser = await puppeteer.launch(launchOptions);
        
          const context = browser.defaultBrowserContext();

          await context.overridePermissions('https://blinkit.com', ['geolocation']);
        
          
          const page = await browser.newPage();

          page.setDefaultNavigationTimeout(45000);

          page.setGeolocation({
            latitude: 19.0759837,
            longitude:72.8776559
          })
        
          await delay(1000)

          await page.goto("https://blinkit.com");

          const LocationBox = 'button.btn.location-box.mask-button'
          await page.waitForSelector(LocationBox)
          await page.click(LocationBox);
          await delay(1000)

          const prids = ["532966","532967"]

          for (const prid of prids) {
            const newPage = await browser.newPage();
            newPage.setDefaultNavigationTimeout(5000);

            await newPage.goto(`https://blinkit.com/prn/a/prid/${prid}`);

            await delay(5000)
            await newPage.close();
          }
          await browser.close();

        } catch (error) {
          console.error("Error during product scraping:", error);
        } 
      });
    }
    
    await cluster.idle();
    await cluster.close();
  } catch (e) {
    console.log("Error in Handler:", e);
    return e;
  }
};

// Test - npx ts-node index.ts
(async () => {
  try {
    await handler();
  } catch (e) {
    console.log("Error in Handler:", e);
  }
})();