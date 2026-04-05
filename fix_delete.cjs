const fs = require('fs');

let skillsView = fs.readFileSync('src/views/SkillsView.tsx', 'utf-8');
skillsView = skillsView.replace(
  'onClick={() => onDeleteSkill(skill)}',
  `onClick={async (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    try {
                      await onDeleteSkill(skill);
                    } catch (err) {
                      alert("Delete failed: " + (err instanceof Error ? err.message : String(err)));
                    }
                  }}`
);
fs.writeFileSync('src/views/SkillsView.tsx', skillsView);

let appTsx = fs.readFileSync('src/App.tsx', 'utf-8');
appTsx = appTsx.replace(
  'await dispatch(',
  `try {
      await dispatch(`
);
appTsx = appTsx.replace(
  'successMessage: labels.skillDeleted,\n      })\n    ).unwrap();\n  };',
  `successMessage: labels.skillDeleted,
      })
    ).unwrap();
    } catch (e) {
      alert('Delete failed in App.tsx: ' + String(e));
      throw e;
    }
  };`
);
fs.writeFileSync('src/App.tsx', appTsx);
console.log("Patched");
