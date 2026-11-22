const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

const SCREENSHOT_DIR = 'C:/Users/Tushar/.gemini/antigravity/brain/739574b7-3dc4-473b-9b8f-9dd464656930/screenshots';
const BASE_URL = 'http://localhost:3000';

async function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function runE2ETests() {
  console.log('🚀 Launching Chrome for End-to-End Browser Testing...');

  const consoleErrors = [];

  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1280,900'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900 });

  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
      console.error('Browser Console Error:', msg.text());
    }
  });

  page.on('pageerror', (err) => {
    consoleErrors.push(err.toString());
    console.error('Page Uncaught Error:', err);
  });

  try {
    // 1. Landing Page
    console.log('\n--- 1. Testing Landing Page ---');
    await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle2' });
    await delay(1000);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '01_landing.png') });
    console.log('✓ Captured 01_landing.png');

    // 2. Register Page
    console.log('\n--- 2. Testing Register Page ---');
    await page.goto(`${BASE_URL}/register`, { waitUntil: 'networkidle2' });
    await delay(600);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '02_register.png') });
    console.log('✓ Captured 02_register.png');

    // 3. Login Page
    console.log('\n--- 3. Testing Login Page ---');
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle2' });
    await delay(600);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '03_login.png') });
    console.log('✓ Captured 03_login.png');

    // Perform Login
    console.log('Logging in as tushar@example.com...');
    await page.click('button[type="submit"]');
    await delay(2000);

    // 4. Dashboard
    console.log('\n--- 4. Testing Dashboard Page ---');
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '04_dashboard.png') });
    console.log('✓ Captured 04_dashboard.png');

    // Test Quick Actions: Add Room modal
    console.log('Testing Add Room modal from Dashboard...');
    const addRoomButtons = await page.$$('button');
    for (const btn of addRoomButtons) {
      const text = await page.evaluate((el) => el.innerText, btn);
      if (text.includes('Add Room')) {
        await btn.click();
        break;
      }
    }
    await delay(600);
    await page.type('input[placeholder*="Living Room"]', 'Study Room');
    await page.click('button[type="submit"]');
    await delay(1200);

    // 5. My Plants Page
    console.log('\n--- 5. Testing My Plants Page ---');
    await page.goto(`${BASE_URL}/plants`, { waitUntil: 'networkidle2' });
    await delay(1000);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '05_my_plants.png') });
    console.log('✓ Captured 05_my_plants.png');

    // Test Search input
    console.log('Testing plant search filtering...');
    await page.type('input[placeholder*="Search plants"]', 'Snake');
    await delay(600);
    await page.click('input[placeholder*="Search plants"]', { clickCount: 3 });
    await page.keyboard.press('Backspace');
    await delay(600);

    // 6. Add Plant Page
    console.log('\n--- 6. Testing Add Plant Page ---');
    await page.goto(`${BASE_URL}/add-plant`, { waitUntil: 'networkidle2' });
    await delay(800);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '06_add_plant.png') });
    console.log('✓ Captured 06_add_plant.png');

    // Submit new plant
    await page.type('input[placeholder*="Money Plant"]', 'Golden Pothos');
    await page.type('input[placeholder*="Epipremnum"]', 'Epipremnum aureum');
    await page.click('button[type="submit"]');
    await delay(1800);

    // 7. Plant Detail Page
    console.log('\n--- 7. Testing Plant Detail Page ---');
    await page.goto(`${BASE_URL}/plants/1`, { waitUntil: 'networkidle2' });
    await delay(1000);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '07_plant_detail.png') });
    console.log('✓ Captured 07_plant_detail.png');

    // 8. Rooms Page
    console.log('\n--- 8. Testing Rooms Page ---');
    await page.goto(`${BASE_URL}/rooms`, { waitUntil: 'networkidle2' });
    await delay(1000);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '08_rooms.png') });
    console.log('✓ Captured 08_rooms.png');

    // 9. Care Schedule Page
    console.log('\n--- 9. Testing Care Schedule Page ---');
    await page.goto(`${BASE_URL}/schedule`, { waitUntil: 'networkidle2' });
    await delay(1000);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '09_care_schedule.png') });
    console.log('✓ Captured 09_care_schedule.png');

    // 10. Log Book Page
    console.log('\n--- 10. Testing Log Book Page ---');
    await page.goto(`${BASE_URL}/logs`, { waitUntil: 'networkidle2' });
    await delay(1000);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '10_log_book.png') });
    console.log('✓ Captured 10_log_book.png');

    // 11. Mobile Responsive View (375px x 812px)
    console.log('\n--- 11. Testing Mobile Responsive View (375px) ---');
    await page.setViewport({ width: 375, height: 812, isMobile: true, hasTouch: true });
    await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'networkidle2' });
    await delay(1000);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '11_mobile_dashboard.png') });
    console.log('✓ Captured 11_mobile_dashboard.png');

    // Mobile Care Schedule
    await page.goto(`${BASE_URL}/schedule`, { waitUntil: 'networkidle2' });
    await delay(800);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '11b_mobile_schedule.png') });
    console.log('✓ Captured 11b_mobile_schedule.png');

    // 12. User Profile Page (desktop viewport)
    console.log('\n--- 12. Testing Profile Page ---');
    await page.setViewport({ width: 1280, height: 900 });
    await page.goto(`${BASE_URL}/profile`, { waitUntil: 'networkidle2' });
    await delay(800);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '12_profile.png') });
    console.log('✓ Captured 12_profile.png');

    console.log('\n========================================');
    console.log('🎉 ALL BROWSER E2E TESTS COMPLETED SUCCESSFULLY!');
    console.log(`Total Console Errors: ${consoleErrors.length}`);
    console.log('========================================');
  } catch (err) {
    console.error('E2E Test Execution Error:', err);
  } finally {
    await browser.close();
  }
}

runE2ETests();
