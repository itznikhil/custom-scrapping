import { Callback, Context, Handler } from "aws-lambda";
import { Browser, Page, PuppeteerLaunchOptions } from "puppeteer";
import { PuppeteerExtra } from "puppeteer-extra";

interface ExampleEvent {}

function delay(time: number) {
  return new Promise(resolve => setTimeout(resolve, time));
}

export const handler: Handler = async (
  event: ExampleEvent,
  context: Context,
  callback: Callback
): Promise<any> => {
  try {
    console.log("event:", event);
    const puppeteer: PuppeteerExtra = require("puppeteer-extra");
    const stealthPlugin = require("puppeteer-extra-plugin-stealth");
    puppeteer.use(stealthPlugin());

    // const proxyPlugin = require("puppeteer-extra-plugin-proxy");
    // puppeteer.use(
    //   proxyPlugin({
    //     address: "pr.oxylabs.io",
    //     port: 7777,
    //     credentials: {
    //       username: "customer-<username>-cc-US",
    //       password: "<password>",
    //     },
    //   })
    // );

    
    const launchOptions: PuppeteerLaunchOptions = context.functionName
      ? {
          headless: true,
          executablePath: puppeteer.executablePath(),
          args: [
            "--no-sandbox",
            "--disable-setuid-sandbox",
            "--disable-dev-shm-usage",
            "--disable-gpu",
            "--incognito",
            "--disable-client-side-phishing-detection",
            "--disable-software-rasterizer",
          ],
        }
      : {
          headless: false,
          executablePath: puppeteer.executablePath(),

        };

    // const browser: Browser = await puppeteer.launch(launchOptions);
    // await delay(1000)
    // const page: Page = await browser.newPage();
    // await delay(1000)
    // await page.goto("https://www.blinkit.com");
    // await delay(1000)
    // console.log(await page.content());
    // await browser.close();

    console.log('count: ', 5)
  } catch (e) {
    console.log("Error in Lambda Handler:", e);
    return e;
  }
};