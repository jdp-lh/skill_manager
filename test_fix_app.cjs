const fs = require('fs');

let content = fs.readFileSync('src/App.test.tsx', 'utf8');

// Replace await user.click(await screen.findByRole("button", { name: "Tools" }));
// with an act block to resolve the warning

content = content.replace(
  /await user\.click\(await screen\.findByRole\("button", \{ name: "Tools" \}\)\);/g,
  `await act(async () => { await user.click(await screen.findByRole("button", { name: "Tools" })); });`
);

content = content.replace(
  /await user\.click\(screen\.getByRole\("button", \{ name: "新增 Tool" \}\)\);/g,
  `await act(async () => { await user.click(screen.getByRole("button", { name: "新增 Tool" })); });`
);

content = content.replace(
  /await user\.click\(screen\.getByRole\("button", \{ name: "编辑 Tool Claude Code Skills Path" \}\)\);/g,
  `await act(async () => { await user.click(screen.getByRole("button", { name: "编辑 Tool Claude Code Skills Path" })); });`
);

content = content.replace(
  /await user\.clear\(skillsPathInput\);/g,
  `await act(async () => { await user.clear(skillsPathInput); });`
);

content = content.replace(
  /await user\.type\(skillsPathInput, "\/mock\/claude\/custom-skills"\);/g,
  `await act(async () => { await user.type(skillsPathInput, "/mock/claude/custom-skills"); });`
);

fs.writeFileSync('src/App.test.tsx', content);
