import { expect, test } from "@playwright/test";

test("编辑 Skill 测试", async ({ page }) => {
  page.on('console', msg => console.log('BROWSER CONSOLE:', msg.type(), msg.text()));
  page.on('pageerror', error => console.log('BROWSER ERROR:', error.message));
  
  await page.goto("/");

  await page.getByRole("button", { name: "Skills" }).click();
  await expect(page.getByRole("heading", { name: "refactor_plan.md" })).toBeVisible();

  await page.getByRole("button", { name: "编辑 Skill" }).first().click();
  await expect(page.getByRole("textbox")).toBeVisible();
});
