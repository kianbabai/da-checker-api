const express = require('express');
const puppeteer = require('puppeteer-core');
const chromium = require('@sparticuz/chromium');
const app = express();

app.use(express.json());

app.post('/domain-analysis', async (req, res) => {
  const { domain } = req.body;

  try {
    // Launch Puppeteer with @sparticuz/chromium
    const browser = await puppeteer.launch({
      executablePath: await chromium.executablePath(), // Use the Chromium binary
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--disable-gpu',
        '--window-size=1920,1080',
        ...chromium.args, // Add Chromium-specific args
      ],
    });

    const page = await browser.newPage();
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    );

    await page.goto('https://ralfvanveen.com/en/tools/domain-authority-checker/', {
      waitUntil: 'networkidle2',
      timeout: 60000,
    });

    await page.type('#url', domain);
    await page.click('#submit');

    await page.waitForSelector('.tools-widget', { visible: true, timeout: 60000 });

    const result = await page.evaluate(() => {
      const widgets = document.querySelectorAll('.tools-widget');
      return Array.from(widgets).map(widget => widget.innerHTML);
    });

    await browser.close();

    res.json({
      success: true,
      result,
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

module.exports = app;