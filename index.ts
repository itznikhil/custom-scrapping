import { Browser, Page, PuppeteerLaunchOptions } from "puppeteer";
import { PuppeteerExtra } from "puppeteer-extra";
import { S3Client, GetObjectCommand, PutObjectCommand ,} from '@aws-sdk/client-s3';
import { Cluster } from "puppeteer-cluster";

const s3 = new S3Client({ region: 'ap-south-1' }); 

const bucketName = 'quick-commerce-data-monitoring';

async function getS3Object(key: string) {
  const command = new GetObjectCommand({ Bucket: bucketName, Key: key });
  const response = await s3.send(command);

  return response
}
async function uploadToS3(key:string, data:any) {


  const params = {
      Bucket: bucketName,
      Key: key,
      Body: data,
  };

  try {
      const command = new PutObjectCommand(params);
      await s3.send(command);
      return "CSV file uploaded successfully to S3.";
  } catch (err) {
      console.error("Error uploading CSV to S3:", err);
  }
}



const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));


export const handler = async (
 
): Promise<any> => {
  try {
    const puppeteer: PuppeteerExtra = require("puppeteer-extra");
    const csv = require('@fast-csv/parse');
    const stealthPlugin = require("puppeteer-extra-plugin-stealth");
    puppeteer.use(stealthPlugin());
    
    let count = 0

    const cluster = await Cluster.launch({
      concurrency: Cluster.CONCURRENCY_CONTEXT,
      maxConcurrency:50,
      puppeteer,
      monitor:true
    });
    const startTime =new Date().getTime();


    for (let index = 0; index < 500; index++) {
      
      cluster.queue( async () => {

        try {
          const launchOptions: PuppeteerLaunchOptions = {
              headless: false,
              executablePath: puppeteer.executablePath(),
              defaultViewport: null,

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
        
          await delay(2000)

          await page.goto("https://blinkit.com");

          const LocationBox = 'button.btn.location-box.mask-button'
          await page.waitForSelector(LocationBox)
          await page.click(LocationBox);
          await delay(2000)

          const prids = ["532966","532967","532966","532967"]


          const response = await getS3Object('Blinkit Areas.csv')

          const csvFile = response.Body;


          let parserFcn = new Promise((resolve, reject) => {
            const parser = csv
              .parseStream(csvFile, { headers: true })
              .on("data", function (data:any) {
                console.log('Data parsed: ', data);
              })
              .on("end", function () {
                resolve("csv parse process finished");
              })
              .on("error", function () {
                reject("csv parse process failed");
              });
          });








          for (const prid of prids) {
            const newPage = await browser.newPage();
            newPage.setDefaultNavigationTimeout(5000);

            await newPage.goto(`https://blinkit.com/prn/a/prid/${prid}`, {waitUntil:'load', timeout:0});

            await delay(500)
            count++
            const endTime = new Date().getTime();

            console.log(`count: ${count}, seconds: ${(endTime - startTime)/1000}}`)
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