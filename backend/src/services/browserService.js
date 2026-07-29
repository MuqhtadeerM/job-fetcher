import puppeteer from "puppeteer";
import logger from "../utils/logger.js";

const PAGE_TIMEOUT_MS = 20000; // longer than our axios timeouts — real browser rendering is slower

/**
 * Launches a headless browser, navigates to the given URL, waits for the
 * page to render, and returns the fully-rendered HTML. Always closes the
 * browser afterward, whether the operation succeeds or fails.
 */
async function fetchRenderedHtml(url) {
  // puppeteer.launch() starts a real (headless) Chrome process.
  // headless: 'new' uses Puppeteer's modern headless rendering mode.
  // args below disable Chrome's sandbox — required in many containerized
  // environments (Docker, some CI systems) where the default sandbox
  // can't initialize properly; a well-known, standard flag combination
  // for running Puppeteer in these environments.
  const browser = await puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  try {
    // A "page" in Puppeteer represents one browser tab.
    const page = await browser.newPage();

    // Set a realistic User-Agent, same reasoning as our axios requests —
    // reduces the chance of being blocked purely for looking automated.
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36",
    );

    // page.goto() navigates to the URL, just like typing it into a browser.
    // waitUntil: 'networkidle2' means "consider navigation complete once
    // there have been no more than 2 active network connections for at
    // least 500ms" — a heuristic for "the page has mostly finished
    // fetching its data," which works well for job-board-style single-page
    // apps that load their listings via one or more background API calls.
    await page.goto(url, {
      waitUntil: "networkidle2",
      timeout: PAGE_TIMEOUT_MS,
    });

    // page.content() returns the CURRENT, fully-rendered HTML of the page —
    // this is the critical difference from axios: this HTML reflects
    // whatever the page's JavaScript has already built into the DOM,
    // not just the original server-sent HTML.
    const html = await page.content();

    return html;
  } finally {
    // finally runs whether the try block succeeded OR threw an error —
    // we MUST close the browser process either way, or we'd leak a real
    // OS process every time this function is called, eventually exhausting
    // server memory/resources. This is the browser equivalent of Step 4's
    // graceful MongoDB disconnect — always clean up what you open.
    await browser.close();
  }
}

export { fetchRenderedHtml };
