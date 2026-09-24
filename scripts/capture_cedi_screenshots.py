"""
Capture BuildMe screenshots for CEDI EiR Cohort 3 Application.
Uses Playwright to navigate the live app and capture key pages.
"""
import os
import time
from playwright.sync_api import sync_playwright

BASE_URL = "http://localhost:56418"
SCREENSHOT_DIR = os.path.join(os.path.dirname(__file__), "cedi_screenshots")

os.makedirs(SCREENSHOT_DIR, exist_ok=True)

def capture_all():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            viewport={"width": 1440, "height": 900},
            device_scale_factor=2
        )
        page = context.new_page()
        page.set_default_timeout(15000)

        screenshots = []

        # 1. Landing page hero
        print("1/10 Capturing landing page hero...")
        page.goto(f"{BASE_URL}/", wait_until="networkidle")
        page.wait_for_timeout(1500)
        path = os.path.join(SCREENSHOT_DIR, "01_landing_hero.png")
        page.screenshot(path=path, full_page=False)
        screenshots.append(path)

        # 2. Landing page full (features + stats + workflow)
        print("2/10 Capturing landing page full...")
        page.screenshot(path=os.path.join(SCREENSHOT_DIR, "02_landing_full.png"), full_page=True)
        screenshots.append(os.path.join(SCREENSHOT_DIR, "02_landing_full.png"))

        # 3. Login page
        print("3/10 Capturing login page...")
        page.goto(f"{BASE_URL}/auth/login", wait_until="networkidle")
        page.wait_for_timeout(1000)
        path = os.path.join(SCREENSHOT_DIR, "03_login.png")
        page.screenshot(path=path)
        screenshots.append(path)

        # 4. Log in as engineer
        print("4/10 Logging in as engineer...")
        page.fill('input[type="email"]', "engineer@buildme.demo")
        page.fill('input[type="password"]', "demo1234")
        page.click('button:has-text("Sign In")')
        page.wait_for_url("**/engineer**", timeout=10000)
        page.wait_for_timeout(2000)

        # 5. Engineer Dashboard
        print("5/10 Capturing engineer dashboard...")
        path = os.path.join(SCREENSHOT_DIR, "04_engineer_dashboard.png")
        page.screenshot(path=path)
        screenshots.append(path)

        # 6. CEDI Demo
        print("6/10 Capturing CEDI Demo...")
        page.goto(f"{BASE_URL}/engineer/cedi-demo", wait_until="networkidle")
        page.wait_for_timeout(2000)
        path = os.path.join(SCREENSHOT_DIR, "05_cedi_demo.png")
        page.screenshot(path=path)
        screenshots.append(path)

        # 7. Cost Intelligence
        print("7/10 Capturing Cost Intelligence...")
        page.goto(f"{BASE_URL}/engineer/cost-intelligence", wait_until="networkidle")
        page.wait_for_timeout(1500)
        path = os.path.join(SCREENSHOT_DIR, "06_cost_intelligence.png")
        page.screenshot(path=path)
        screenshots.append(path)

        # 8. Project Truth - Kumar Residence
        print("8/10 Capturing Project Truth...")
        page.goto(f"{BASE_URL}/engineer/truth", wait_until="networkidle")
        page.wait_for_timeout(1500)
        # Click Kumar Residence
        try:
            page.click('button:has-text("Kumar Residence")', timeout=5000)
            page.wait_for_timeout(1000)
        except:
            pass
        path = os.path.join(SCREENSHOT_DIR, "07_project_truth.png")
        page.screenshot(path=path)
        screenshots.append(path)

        # 9. Design-to-Cost
        print("9/10 Capturing Design-to-Cost...")
        page.goto(f"{BASE_URL}/engineer/design-to-cost", wait_until="networkidle")
        page.wait_for_timeout(1500)
        try:
            page.click('button:has-text("Kumar Residence")', timeout=5000)
            page.wait_for_timeout(1000)
        except:
            pass
        path = os.path.join(SCREENSHOT_DIR, "08_design_to_cost.png")
        page.screenshot(path=path)
        screenshots.append(path)

        # 10. Quotation Intelligence
        print("10/10 Capturing Quotation Intelligence...")
        page.goto(f"{BASE_URL}/engineer/quotations", wait_until="networkidle")
        page.wait_for_timeout(1500)
        try:
            page.click('button:has-text("Kumar Residence")', timeout=5000)
            page.wait_for_timeout(1000)
        except:
            pass
        path = os.path.join(SCREENSHOT_DIR, "09_quotation_intel.png")
        page.screenshot(path=path)
        screenshots.append(path)

        browser.close()
        return screenshots

if __name__ == "__main__":
    paths = capture_all()
    print(f"\nCaptured {len(paths)} screenshots:")
    for p in paths:
        size = os.path.getsize(p) // 1024
        print(f"  {os.path.basename(p)} ({size} KB)")
