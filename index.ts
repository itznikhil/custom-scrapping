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
      concurrency: Cluster.CONCURRENCY_PAGE,
      workerCreationDelay:200,
      maxConcurrency: parseInt(process.env.PUPPETEER_MAXCONCURRENCY || "2"),
      timeout:0,
      puppeteerOptions: {
        defaultViewport: null,
        args:[
          '--start-maximized',
          '--no-sandbox',
          "--proxy-server=103.162.133.224:49155",    
          '--disable-setuid-sandbox',
          '--disable-web-security',
          '--disable-features=IsolateOrigins,site-per-process'
         ],
         headless:false,
      }
      ,
      monitor:true
    });

        const response = await getS3Object("Blinkit Areas.csv");
        const darkStores = await readCSVFile(response as Readable);
        const result = await getS3Object("Combined Data Mapping Anveshan.csv");
          const skus = await readCSVFile(result as Readable);
          const identifier = 'Blinkit PRID'
          const prids =skus.filter(sku => !!sku[identifier]).map(sku => sku[identifier]);
   
          const startTime =new Date().getTime();
          let pageCount = 0

          for (const store of darkStores) {
             cluster.queue(async () => {
              try {


                const browser = await puppeteer.launch({
                  defaultViewport: null,
                  args:[
                    '--start-maximized',
                    '--no-sandbox',
                    "--proxy-server=103.162.133.224:49155",    
                    '--disable-setuid-sandbox',
                    '--disable-web-security',
                    '--disable-features=IsolateOrigins,site-per-process'
                   ],
                   headless:false,
                
                });
      
                const context = browser.defaultBrowserContext();
                await context.overridePermissions('https://blinkit.com', ['geolocation']);
      
                const page = await browser.newPage();

                page.setDefaultNavigationTimeout(45000);

                
                await page.setGeolocation({
                  latitude: parseFloat(store.Latitude),
                  longitude: parseFloat(store.Longitude),
                });
      
                const user = "nikhil0mqUA";
                const password = "kkDouV6zVx";
                await page.authenticate({ username: user, password: password });

                await delay(1000)

      
                await page.goto("https://blinkit.com", { waitUntil: 'load', timeout: 0 });
      
                const locationBox = "button.btn.location-box.mask-button";
                await page.waitForSelector(locationBox, {timeout: 0,});
                await page.click(locationBox, );
                await page.waitForFunction('document.querySelector(".containers__DesktopContainer-sc-95cgcs-0.hAbKnj") === null', {timeout:0});
                await delay(1000);


                for (const prid of prids){

                  
                  const productPage = await browser.newPage();
                  productPage.setDefaultNavigationTimeout(5000)

                  await productPage.setRequestInterception(true);
                  //@ts-ignore
                  productPage.on('request', (request) => {
                    if (['image', 'stylesheet', 'font', 'media'].includes(request.resourceType())) {
                      request.abort();
                    } else {
                      request.continue();
                    }
                  });
                  await productPage.goto(`https://www.blinkit.com/prn/a/prid/${prid}`, {waitUntil:'load', timeout:60000});
                  await delay(1000);

                  const html = productPage.content()
                  
        
                  await productPage.close();
                  pageCount +=1

                             //do something 
                             const endTime = new Date().getTime();
                             const timeTakenSeconds = (endTime - startTime)/1000
                             console.log(`time taken ${timeTakenSeconds} seconds`);
                            console.log(`page count ${pageCount}`)
                            
                }

              await browser.close()
      
      
              } catch (error) {
                console.error(`Error during area processing:`, error);
              }

            })

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