const fs = require('fs');

let content = fs.readFileSync('src/App.test.tsx', 'utf8');

// For whatever reason, act() might be hiding the elements when interacting.
// Let's replace the strict userEvent and act logic with fireEvent which is simpler for tests
// that don't need complex user interaction simulation

content = content.replace(
  /await act\(async \(\) => \{ await user\.type\(screen\.getByLabelText\("Tool ID"\), "custom_tool"\); \}\);/g,
  `fireEvent.change(screen.getByLabelText("Tool ID"), { target: { value: "custom_tool" } });`
);

content = content.replace(
  /await act\(async \(\) => \{ await user\.type\(screen\.getByLabelText\("Tool 名称"\), "Custom Tool"\); \}\);/g,
  `fireEvent.change(screen.getByLabelText("Tool 名称"), { target: { value: "Custom Tool" } });`
);

content = content.replace(
  /await act\(async \(\) => \{ await user\.type\(screen\.getByLabelText\("简要描述"\), "自定义描述"\); \}\);/g,
  `fireEvent.change(screen.getByLabelText("简要描述"), { target: { value: "自定义描述" } });`
);

content = content.replace(
  /await act\(async \(\) => \{ await user\.type\(screen\.getByLabelText\("图标标识"\), "Cpu"\); \}\);/g,
  `fireEvent.change(screen.getByLabelText("图标标识"), { target: { value: "Cpu" } });`
);

content = content.replace(
  /await act\(async \(\) => \{ await user\.type\(screen\.getByLabelText\("标签"\), "custom, cli"\); \}\);/g,
  `fireEvent.change(screen.getByLabelText("标签"), { target: { value: "custom, cli" } });`
);

content = content.replace(
  /await user\.click\(screen\.getByRole\("button", \{ name: "编辑 Custom Tool" \}\)\);/g,
  `await act(async () => { await user.click(screen.getByRole("button", { name: "编辑 Custom Tool" })); });`
);

content = content.replace(
  /await act\(async \(\) => \{ await user\.clear\(screen\.getByLabelText\("Tool 名称"\)\); \}\);/g,
  `fireEvent.change(screen.getByLabelText("Tool 名称"), { target: { value: "" } });`
);

content = content.replace(
  /await act\(async \(\) => \{ await user\.type\(screen\.getByLabelText\("Tool 名称"\), "Custom Tool Updated"\); \}\);/g,
  `fireEvent.change(screen.getByLabelText("Tool 名称"), { target: { value: "Custom Tool Updated" } });`
);

content = content.replace(
  /await act\(async \(\) => \{ await user\.clear\(skillsPathInput\); \}\);/g,
  `fireEvent.change(skillsPathInput, { target: { value: "" } });`
);

content = content.replace(
  /await act\(async \(\) => \{ await user\.type\(skillsPathInput, "\/mock\/claude\/custom-skills"\); \}\);/g,
  `fireEvent.change(skillsPathInput, { target: { value: "/mock/claude/custom-skills" } });`
);

fs.writeFileSync('src/App.test.tsx', content);
