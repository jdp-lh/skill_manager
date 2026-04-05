import { expect, test } from "@playwright/test";

test("完整的 Tools 工作流", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("button", { name: "Agents" }).click();
  await expect(page.getByRole("heading", { name: "Cursor" })).toBeVisible();

  await page.getByRole("button", { name: "新增 Tool" }).click();
  await page.getByLabel("Tool ID").fill("playwright_tool");
  await page.getByLabel("Tool 名称").fill("Playwright Tool");
  await page.getByLabel("简要描述").fill("用于端到端测试的工具");
  await page.getByLabel("图标标识").fill("Cpu");
  await page.getByLabel("标签").fill("test, cli");
  await page.getByRole("button", { name: "保存" }).click();

  await expect(page.getByText("Playwright Tool")).toBeVisible();

  await page.getByPlaceholder("搜索 tool 名称或标签").fill("Playwright");
  await expect(page.getByText("Playwright Tool")).toBeVisible();

  await page.getByRole("button", { name: "配置 Skill" }).last().click();
  // Click on the skill card to transfer it
  const addSkillBtn = page.getByText("refactor_plan").first().locator("..");
  await addSkillBtn.click();
  // There is no "测试 Skill" button anymore in the current config UI
  // await page.getByRole("button", { name: "测试 Skill" }).last().click();
  // await expect(page.getByText(/测试通过/).first()).toBeVisible();
  
  await page.getByRole("button", { name: "保存配置" }).click();
  await expect(page.getByText("Skill 配置已保存")).toBeVisible();
});

test("viewer 权限下不能修改 tool", async ({ page }) => {
  await page.goto("/?role=viewer");
  await page.getByRole("button", { name: "Agents" }).click();

  await expect(page.getByRole("button", { name: "新增 Tool" })).toBeDisabled();
  await expect(page.getByLabel(/删除/).first()).toBeDisabled();
});
