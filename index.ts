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
        console.log('Data parsed: ', data);
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
      maxConcurrency: 2,
      puppeteer,
      puppeteerOptions:{
        args:["--no-sandbox",
        "--disable-setuid-sandbox",]
      }
    });

    const response = await getS3Object("Blinkit Area.csv");
    const stores = await readCSVFile(response as Readable);

    for (const store of stores) {
      await cluster.queue(async () => {
        const browser = await puppeteer.launch({
          headless: 'new',
          args: [
            "--start-maximized",
            "--disable-client-side-phishing-detection",
            "--disable-software-rasterizer",
            "--disable-dev-shm-usage",
            "--proxy-server=103.162.133.224:49155",    

          ],
        
        });
        try {
          console.log(`Processing store: ${store}`);

          const context = browser.defaultBrowserContext();
          await context.overridePermissions('https://blinkit.com', ['geolocation']);

          const firstPage = await context.newPage();
          await firstPage.setGeolocation({
            latitude: parseFloat(store.Latitude),
            longitude: parseFloat(store.Longitude),
          });

          const user = "nikhil0mqUA";
          const password = "kkDouV6zVx";
          await firstPage.authenticate({ username: user, password: password });

          await firstPage.goto("https://blinkit.com", { waitUntil: 'load', timeout: 0 });

          const locationBox = "button.btn.location-box.mask-button";
          await firstPage.waitForSelector(locationBox);
          await firstPage.click(locationBox);
          await firstPage.waitForFunction('document.querySelector(".containers__DesktopContainer-sc-95cgcs-0.hAbKnj") === null');
          await delay(500);

          const products = ["472059", "432775"];
          const promises = products.map(async (product) => {
            const productPage = await context.newPage();
            await productPage.goto(`https://www.blinkit.com/prn/a/prid/${product}`);
            await delay(500);
            await checkBlinkitPrice(productPage);
            
          });

          await Promise.all(promises);

        } catch (error) {
          console.error(`Error during area processing:`, error);
        } finally {
          await browser.close();
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

async function checkBlinkitPrice(page: Page) {
  try {
    const product = await page.evaluate(() => {
      const name = document.querySelector('.ProductVariants__VariantUnitText-sc-1unev4j-6.dhCxof')?.textContent?.trim() ?? '';
      const unit = document.querySelector('.ProductInfoCard__ProductName-sc-113r60q-10.dsuWXl')?.textContent?.trim() ?? '';
      return { name, unit };
    });

    console.log("Product: ", product);

  } catch (error) {
    console.error("Error: ", error);
  }
}

// Test - npx ts-node index.ts
(async () => {
  try {
    await handler();
  } catch (e) {
    console.log("Error in Handler:", e);
  }
})();
