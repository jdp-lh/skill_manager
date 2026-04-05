const fs = require('fs');

let content = fs.readFileSync('src/App.test.tsx', 'utf8');

// The issue in App.test.tsx is often state that is not properly wrapped in act.
// Let's add act to the user.type calls

content = content.replace(
  /await user\.type\(screen\.getByLabelText\("Tool 名称"\), "Custom Tool"\);/g,
  `await act(async () => { await user.type(screen.getByLabelText("Tool 名称"), "Custom Tool"); });`
);

content = content.replace(
  /await user\.type\(screen\.getByLabelText\("简要描述"\), "自定义描述"\);/g,
  `await act(async () => { await user.type(screen.getByLabelText("简要描述"), "自定义描述"); });`
);

content = content.replace(
  /await user\.type\(screen\.getByLabelText\("图标标识"\), "Cpu"\);/g,
  `await act(async () => { await user.type(screen.getByLabelText("图标标识"), "Cpu"); });`
);

content = content.replace(
  /await user\.type\(screen\.getByLabelText\("标签"\), "custom, cli"\);/g,
  `await act(async () => { await user.type(screen.getByLabelText("标签"), "custom, cli"); });`
);

content = content.replace(
  /await user\.type\(screen\.getByLabelText\("Tool ID"\), "custom_tool"\);/g,
  `await act(async () => { await user.type(screen.getByLabelText("Tool ID"), "custom_tool"); });`
);

content = content.replace(
  /await user\.click\(screen\.getByRole\("button", \{ name: "保存" \}\)\);/g,
  `await act(async () => { await user.click(screen.getByRole("button", { name: "保存" })); });`
);

content = content.replace(
  /await user\.clear\(screen\.getByLabelText\("Tool 名称"\)\);/g,
  `await act(async () => { await user.clear(screen.getByLabelText("Tool 名称")); });`
);

content = content.replace(
  /await user\.type\(screen\.getByLabelText\("Tool 名称"\), "Custom Tool Updated"\);/g,
  `await act(async () => { await user.type(screen.getByLabelText("Tool 名称"), "Custom Tool Updated"); });`
);

content = content.replace(
  /await user\.click\(screen\.getByRole\("button", \{ name: "删除 Custom Tool Updated" \}\)\);/g,
  `await act(async () => { await user.click(screen.getByRole("button", { name: "删除 Custom Tool Updated" })); });`
);

if (!content.includes('import { act }') && !content.includes('import { fireEvent, render, screen, waitFor, act }')) {
  content = content.replace(
    /import \{ fireEvent, render, screen, waitFor \} from "@testing-library\/react";/,
    'import { fireEvent, render, screen, waitFor, act } from "@testing-library/react";'
  );
}

fs.writeFileSync('src/App.test.tsx', content);
