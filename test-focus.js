const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  await page.goto('http://localhost:3000');
  await page.click('button:has-text("Form Builder")');
  
  // Drag columns into canvas
  await page.dragAndDrop('div.component-palette-item:has-text("Columns")', '.builder-dropzone-root', { force: true });
  await page.waitForTimeout(500);
  
  // Click on the column component specifically (either by title or by class)
  await page.click('.builder-component-wrapper');
  await page.waitForTimeout(500);
  
  // Open Layout
  await page.click('button.p-accordionheader:has-text("Layout")');
  await page.waitForTimeout(500);

  // Type into width
  const input = page.locator('input[type="number"]').first();
  await input.focus();
  await page.waitForTimeout(200);
  await page.keyboard.press('Backspace');
  await page.waitForTimeout(200);
  await page.keyboard.type('4');
  await page.waitForTimeout(200);
  
  const isFocused = await input.evaluate(el => document.activeElement === el);
  console.log('Is width input still focused after typing?', isFocused);
  
  await page.waitForTimeout(1000);
  
  await browser.close();
})();
