import { Cluster } from "puppeteer-cluster";
import { S3Client, GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { Readable } from "stream";



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
    const { addExtra } = require('puppeteer-extra')
    const Stealth = require('puppeteer-extra-plugin-stealth')
    const vanillaPuppeteer = require('puppeteer')

    const puppeteer = addExtra(vanillaPuppeteer)
    puppeteer.use(Stealth())

    const cluster = await Cluster.launch({
      puppeteer,
      concurrency: Cluster.CONCURRENCY_CONTEXT,
      maxConcurrency: 50,
      
      puppeteerOptions: {
        args:['--no-sandbox', '--disable-setuid-sandbox',  "--start-maximized",

         ],
         headless:false
      }
    });

        const response = await getS3Object("Blinkit Areas.csv");
        const darkStores = await readCSVFile(response as Readable);
        const result = await getS3Object("Combined Data Mapping Anveshan.csv");
          const skus = await readCSVFile(response as Readable);
          const identifier = 'Blinkit PRID'
          const p_ids =skus.filter(sku => !!sku[identifier]).map(sku => sku[identifier]);
   


       await cluster.task(async ({page, data:url}) => {
        try {
          await page.goto(url, {waitUntil:'networkidle2', timeout:60000});
          const htmlContent = await page.content();
          
          console.log('HTML Content: ', htmlContent)
      


        } catch (error) {
          console.error(`Task Failed :`, error);
        } 
      });
    


    for (let index = 0; index < 10000; index++) {
      cluster.queue('https://blinkit.com/')
      
    }

    cluster.on('taskerror', (err, data, willRetry) => {
      if (willRetry) {
        console.warn(`Encountered an error while crawling ${data}. ${err.message}\nThis job will be retried`);
      } else {
        console.error(`Failed to crawl ${data}: ${err.message}`);
      }
  });

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