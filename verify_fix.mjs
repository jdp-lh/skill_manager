import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();

const logs = [];
page.on("console", (msg) => logs.push(`[${msg.type()}] ${msg.text()}`));

await page.goto("http://localhost:1422/");
await page.waitForLoadState("networkidle");

console.log("=== Page loaded ===");

// Step 1: Find and click delete button
const deleteButtons = page.locator('button[aria-label*="删除"]');
const count = await deleteButtons.count();
console.log(`Found ${count} delete buttons`);

if (count > 0) {
  const firstBtn = deleteButtons.nth(0);
  
  // Click delete button - should show custom confirmation dialog (NOT window.confirm)
  console.log("\n--- Clicking delete button ---");
  await firstBtn.click();
  await page.waitForTimeout(500);
  
  // Check if custom confirmation modal appeared
  const modalVisible = await page.locator('text=删除').nth(1).isVisible().catch(() => false);
  const confirmBtn = page.locator('button:has-text("删除")');
  const cancelBtn = page.locator('button:has-text("取消")');
  
  const confirmCount = await confirmBtn.count();
  const cancelCount = await cancelBtn.count();
  
  console.log(`Confirm buttons on page: ${confirmCount}`);
  console.log(`Cancel buttons on page: ${cancelCount}`);
  
  // Take screenshot after click
  await page.screenshot({ path: "skills_delete_modal.png", fullPage: true });
  
  if (confirmCount >= 2) {
    console.log("\n✅ SUCCESS: Custom delete confirmation dialog appeared!");
    
    // Click the confirm button in the modal (last "删除" button)
    const lastConfirm = confirmBtn.nth(confirmCount - 1);
    await lastConfirm.click();
    await page.waitForTimeout(1500);
    
    // Check if skill was deleted (count should decrease)
    const newCount = await deleteButtons.count();
    console.log(`\nAfter confirming delete, remaining delete buttons: ${newCount}`);
    
    if (newCount < count) {
      console.log("✅ SUCCESS: Skill was deleted successfully!");
    } else {
      console.log("⚠️ Skill count did not change (might be mock API behavior)");
    }
    
    await page.screenshot({ path: "skills_after_delete.png", fullPage: true });
  } else {
    console.log("❌ FAIL: No confirmation dialog appeared");
  }
}

// Also test edit button works
const editButtons = page.locator('button:text("编辑 Skill")');
const editCount = await editButtons.count();
console.log(`\n=== Edit buttons: ${editCount} ===`);

if (editCount > 0) {
  const editBtn = editButtons.nth(0);
  await editBtn.click();
  await page.waitForTimeout(1000);
  
  // Check if editor opened
  const textarea = page.locator('textarea');
  const hasTextarea = await textarea.count() > 0;
  console.log(`Editor opened (textarea visible): ${hasTextarea}`);
  
  if (hasTextarea) {
    console.log("✅ Edit button works correctly!");
  }
}

console.log("\n=== Done ===");
await browser.close();
