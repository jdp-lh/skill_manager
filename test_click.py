from playwright.sync_api import sync_playwright
import json

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()
    
    logs = []
    errors = []
    page.on("console", lambda msg: logs.append(f"[{msg.type}] {msg.text}"))
    page.on("pageerror", lambda err: errors.append(str(err)))
    
    page.goto("http://localhost:1422/")
    page.wait_for_load_state("networkidle")
    
    print("=== Page loaded ===")
    print(f"URL: {page.url}")
    
    page.screenshot(path="/Users/bytedance/jdp_github_project/skill_manager/skills_before_click.png", full_page=True)
    
    delete_buttons = page.locator('button[aria-label*="删除"]')
    count = delete_buttons.count()
    print(f"\n=== Found {count} delete buttons ===")
    
    if count > 0:
        first_btn = delete_buttons.nth(0)
        bounding_box = first_btn.bounding_box()
        print(f"First delete button bounding box: {bounding_box}")
        
        is_visible = first_btn.is_visible()
        is_enabled = first_btn.is_enabled()
        print(f"Visible: {is_visible}, Enabled: {is_enabled}")
        
        dialog_handled = [False]
        def handle_dialog(dialog):
            dialog_handled[0] = True
            print(f"\n!!! Dialog appeared: type={dialog.type}, message={dialog.message}")
            dialog.dismiss()
        page.on("dialog", handle_dialog)
        
        print("\n--- Clicking first delete button ---")
        try:
            first_btn.click(timeout=5000)
            page.wait_for_timeout(2000)
            
            if dialog_handled[0]:
                print("SUCCESS: Delete button click triggered confirm dialog!")
            else:
                print("WARNING: No dialog appeared after clicking delete button")
                page.screenshot(path="/Users/bytedance/jdp_github_project/skill_manager/skills_after_click.png", full_page=True)
                
                overlays = page.evaluate("""() => {
                    const all = document.elementsFromPoint(window.innerWidth / 2, 150);
                    return all.map(el => ({
                        tag: el.tagName,
                        className: typeof el.className === 'string' ? el.className : '',
                        id: el.id,
                        pointerEvents: getComputedStyle(el).pointerEvents,
                        zIndex: getComputedStyle(el).zIndex,
                        position: getComputedStyle(el).position,
                    }));
                }""")
                print(f"\nElements at card area: {json.dumps(overlays, indent=2)}")
                
        except Exception as e:
            print(f"ERROR clicking delete button: {e}")
    
    edit_buttons = page.locator('button:text("编辑 Skill")')
    edit_count = edit_buttons.count()
    print(f"\n=== Found {edit_count} edit buttons ===")
    
    if edit_count > 0:
        edit_btn = edit_buttons.nth(0)
        edit_visible = edit_btn.is_visible()
        edit_enabled = edit_btn.is_enabled()
        edit_box = edit_btn.bounding_box()
        print(f"Edit button - Visible: {edit_visible}, Enabled: {edit_enabled}, Box: {edit_box}")
    
    print("\n=== Console Logs (last 20) ===")
    for log in logs[-20:]:
        print(log)
    
    print("\n=== Page Errors ===")
    for err in errors:
        print(f"ERROR: {err}")
    
    browser.close()
