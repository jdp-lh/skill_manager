const fs = require('fs');
let appTsx = fs.readFileSync('src/App.tsx', 'utf-8');
appTsx = appTsx.replace(
  'successMessage: labels.skillDeleted,\n      })\n    ).unwrap();\n    } catch (e) {\n      alert(\'Delete failed in App.tsx: \' + String(e));\n      throw e;\n    }\n  };',
  `successMessage: labels.skillDeleted,
      })
    ).unwrap();
    } catch (e) {
      console.error('Delete failed in App.tsx:', e);
      alert('Delete failed: ' + String(e));
    }
  };`
);
fs.writeFileSync('src/App.tsx', appTsx);
console.log("Patched");
