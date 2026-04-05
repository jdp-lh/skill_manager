import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();

const logs = [];
const errors = [];
page.on("console", (msg) => logs.push(`[${msg.type}] ${msg.text()}`));
page.on("pageerror", (err) => errors.push(String(err)));

await page.goto("http://localhost:1422/");
await page.waitForLoadState("networkidle");

console.log("=== Page loaded ===");
console.log(`URL: page.url()`);

await page.screenshot({ path: "skills_before_click.png", fullPage: true });

const deleteButtons = page.locator('button[aria-label*="删除"]');
const count = await deleteButtons.count();
console.log(`\n=== Found ${count} delete buttons ===`);

if (count > 0) {
  const firstBtn = deleteButtons.nth(0);
  const box = await firstBtn.boundingBox();
  console.log(`First delete button bounding box: ${JSON.stringify(box)}`);

  const isVisible = await firstBtn.isVisible();
  const isEnabled = await firstBtn.isEnabled();
  console.log(`Visible: ${isVisible}, Enabled: ${isEnabled}`);

  let dialogHandled = false;
  page.on("dialog", async (dialog) => {
    dialogHandled = true;
    console.log(`\n!!! Dialog appeared: type=${dialog.type()}, message=${dialog.message()}`);
    await dialog.dismiss();
  });

  console.log("\n--- Clicking first delete button ---");
  try {
    await firstBtn.click({ timeout: 5000 });
    await page.waitForTimeout(2000);

    if (dialogHandled) {
      console.log("SUCCESS: Delete button click triggered confirm dialog!");
    } else {
      console.log("WARNING: No dialog appeared after clicking delete button");
      await page.screenshot({ path: "skills_after_click.png", fullPage: true });

      const centerX = box ? box.x + box.width / 2 : 400;
      const centerY = box ? box.y + box.height / 2 : 150;
      const overlays = await page.evaluate(({ x, y }) => {
        const all = document.elementsFromPoint(x, y);
        return all.map(el => ({
          tag: el.tagName,
          className: typeof el.className === 'string' ? el.className.substring(0, 80) : '',
          id: el.id,
          pointerEvents: getComputedStyle(el).pointerEvents,
          zIndex: getComputedStyle(el).zIndex,
          position: getComputedStyle(el).position,
        }));
      }, { x: centerX, y: centerY });
      console.log(`\nElements at (${centerX}, ${centerY}):`);
      console.log(JSON.stringify(overlays, null, 2));
    }
  } catch (e) {
    console.error(`ERROR clicking delete button: ${e.message}`);
  }
}

const editButtons = page.locator('button:text("编辑 Skill")');
const editCount = await editButtons.count();
console.log(`\n=== Found ${editCount} edit buttons ===`);

if (editCount > 0) {
  const editBtn = editButtons.nth(0);
  const eVisible = await editBtn.isVisible();
  const eEnabled = await editBtn.isEnabled();
  const eBox = await editBtn.boundingBox();
  console.log(`Edit button - Visible: ${eVisible}, Enabled: ${eEnabled}, Box: ${JSON.stringify(eBox)}`);
}

console.log("\n=== Console Logs (last 20) ===");
logs.slice(-20).forEach(l => console.log(l));

console.log("\n=== Page Errors ===");
errors.forEach(e => console.log(`ERROR: ${e}`));

await browser.close();
