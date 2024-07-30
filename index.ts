import { Cluster } from "puppeteer-cluster";
import { S3Client, GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { Readable } from "stream";
import { PuppeteerExtra } from "puppeteer-extra";
import { Page } from "puppeteer";

const s3 = new S3Client({
  region: "ap-south-1",
});
const bucketName = "quick-commerce-data-monitoring";

async function getS3Object(key: string) {
  const command = new GetObjectCommand({ Bucket: bucketName, Key: key });
  const response = await s3.send(command);
  return response.Body;
}


async function readCSVFile(csvFile: Readable) {
  const csv = require("@fast-csv/parse");

  let rows: any[] = [];
  await new Promise((resolve, reject) => {
    csvFile
      .pipe(csv.parse({ headers: true }))
      .on("data", (data: any) => {
        rows.push(data);
      })
      .on("end", resolve)
      .on("error", reject);
  });

  return rows;
}

async function uploadToS3(key: string, data: any) {
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

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const handler = async (): Promise<any> => {
  try {
    const puppeteer: PuppeteerExtra = require("puppeteer-extra");
    const stealthPlugin = require("puppeteer-extra-plugin-stealth");

    puppeteer.use(stealthPlugin());

    const cluster = await Cluster.launch({
      concurrency: Cluster.CONCURRENCY_CONTEXT,
      maxConcurrency: 10,
      puppeteer,
      puppeteerOptions: {
        args:['--no-sandbox', '--disable-setuid-sandbox']
      }
    });

    const response = await getS3Object("Blinkit Areas.csv");
    const stores = await readCSVFile(response as Readable);

   


    for (const store of stores) {
      await cluster.queue(async () => {
        try {

          const browser = await puppeteer.launch({
            headless: false,
            args: [
              "--start-maximized",
              "--disable-client-side-phishing-detection",
              "--disable-software-rasterizer",
              "--disable-dev-shm-usage",
              "--proxy-server=103.162.133.224:49155",    
          
              '--no-sandbox', '--disable-setuid-sandbox'
            ],
          
          });

          const context = browser.defaultBrowserContext();
          await context.overridePermissions('https://blinkit.com', ['geolocation']);

          const locationPage = await context.newPage();
          await locationPage.setGeolocation({
            latitude: parseFloat(store.Latitude),
            longitude: parseFloat(store.Longitude),
          });

          const user = "nikhil0mqUA";
          const password = "kkDouV6zVx";
          await locationPage.authenticate({ username: user, password: password });

          await locationPage.goto("https://blinkit.com", { waitUntil: 'load', timeout: 0 });

          const locationBox = "button.btn.location-box.mask-button";
          await locationPage.waitForSelector(locationBox, {timeout: 0,});
          await locationPage.click(locationBox, );
          await locationPage.waitForFunction('document.querySelector(".containers__DesktopContainer-sc-95cgcs-0.hAbKnj") === null', {timeout:0});
          await delay(500);

          const response = await getS3Object("Combined Data Mapping Anveshan.csv");
          const skus = await readCSVFile(response as Readable);

          const key = 'Blinkit PRID'

          const p_ids=skus.filter(sku => !!sku[key]).map(sku => sku[key]);

          const promises = p_ids.map(async (pid) => {
            const productPage = await context.newPage();
            await productPage.goto(`https://www.blinkit.com/prn/a/prid/${pid}`);
        
            
          });

          await Promise.all(promises);

          await browser.close()

        } catch (error) {
          console.error(`Error during area processing:`, error);
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
