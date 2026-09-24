"""
BuildMe CEDI Demo Video Recorder
Records a full walkthrough of the BuildMe application.
"""
import os
import time
from playwright.sync_api import sync_playwright

DEMO_URL = "https://buildme-git-main-tharunya0105-afks-projects.vercel.app"
VIDEO_DIR = os.path.join(os.path.dirname(__file__), "demo_videos")
os.makedirs(VIDEO_DIR, exist_ok=True)

def record_demo():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            viewport={"width": 1440, "height": 900},
            record_video_dir=VIDEO_DIR,
            record_video_size={"width": 1440, "height": 900},
        )
        page = context.new_page()
        page.set_default_timeout(15000)

        # ── Step 1: Landing Page ────────────────────────────────────────────
        print("Step 1: Landing page...")
        page.goto(DEMO_URL, wait_until="networkidle", timeout=30000)
        page.wait_for_timeout(3000)
        page.screenshot(path=os.path.join(VIDEO_DIR, "01_landing.png"))

        # Scroll down to show stats and features
        page.evaluate("window.scrollTo(0, 600)")
        page.wait_for_timeout(2000)
        page.screenshot(path=os.path.join(VIDEO_DIR, "02_landing_features.png"))
        page.evaluate("window.scrollTo(0, 1200)")
        page.wait_for_timeout(2000)
        page.screenshot(path=os.path.join(VIDEO_DIR, "03_landing_workflow.png"))
        page.evaluate("window.scrollTo(0, 0)")
        page.wait_for_timeout(1000)

        # ── Step 2: Navigate to Login ───────────────────────────────────────
        print("Step 2: Login page...")
        page.goto(f"{DEMO_URL}/auth/login", wait_until="networkidle", timeout=30000)
        page.wait_for_timeout(3000)
        page.screenshot(path=os.path.join(VIDEO_DIR, "04_login.png"))

        # ── Step 3: Login as Engineer ───────────────────────────────────────
        print("Step 3: Logging in as engineer...")
        # Fill email - the Input component renders a standard input
        email_input = page.locator('input[type="email"]').first
        email_input.wait_for(state="visible", timeout=10000)
        email_input.fill("engineer@buildme.demo")
        page.wait_for_timeout(500)

        # Fill password
        pw_input = page.locator('input[type="password"]').first
        pw_input.wait_for(state="visible", timeout=10000)
        pw_input.fill("demo1234")
        page.wait_for_timeout(500)

        # Click sign in button
        page.locator('button:has-text("Sign In")').first.click()
        page.wait_for_timeout(4000)

        # ── Step 4: Engineer Dashboard ──────────────────────────────────────
        print("Step 4: Engineer dashboard...")
        page.wait_for_load_state("networkidle", timeout=15000)
        page.wait_for_timeout(3000)
        page.screenshot(path=os.path.join(VIDEO_DIR, "05_dashboard.png"))

        # Scroll down to show project cards
        page.evaluate("window.scrollTo(0, 400)")
        page.wait_for_timeout(2000)
        page.screenshot(path=os.path.join(VIDEO_DIR, "06_dashboard_projects.png"))

        # ── Step 5: CEDI Demo ──────────────────────────────────────────────
        print("Step 5: CEDI Demo page...")
        page.goto(f"{DEMO_URL}/engineer/cedi-demo", wait_until="networkidle", timeout=30000)
        page.wait_for_timeout(3000)
        page.screenshot(path=os.path.join(VIDEO_DIR, "07_cedi_demo.png"))

        # Scroll down to see the hero story
        page.evaluate("window.scrollTo(0, 500)")
        page.wait_for_timeout(2000)
        page.screenshot(path=os.path.join(VIDEO_DIR, "08_cedi_story.png"))
        page.evaluate("window.scrollTo(0, 1000)")
        page.wait_for_timeout(2000)
        page.screenshot(path=os.path.join(VIDEO_DIR, "09_cedi_steps.png"))
        page.evaluate("window.scrollTo(0, 0)")
        page.wait_for_timeout(1000)

        # ── Step 6: Cost Intelligence ───────────────────────────────────────
        print("Step 6: Cost Intelligence...")
        page.goto(f"{DEMO_URL}/engineer/cost-intelligence", wait_until="networkidle", timeout=30000)
        page.wait_for_timeout(3000)
        page.screenshot(path=os.path.join(VIDEO_DIR, "10_cost_intelligence.png"))

        # Scroll down to show data sources
        page.evaluate("window.scrollTo(0, 500)")
        page.wait_for_timeout(2000)
        page.screenshot(path=os.path.join(VIDEO_DIR, "11_cost_sources.png"))

        # ── Step 7: Project Truth ───────────────────────────────────────────
        print("Step 7: Project Truth...")
        page.goto(f"{DEMO_URL}/engineer/truth", wait_until="networkidle", timeout=30000)
        page.wait_for_timeout(3000)
        page.screenshot(path=os.path.join(VIDEO_DIR, "12_project_truth.png"))

        # Scroll to show budget story
        page.evaluate("window.scrollTo(0, 500)")
        page.wait_for_timeout(2000)
        page.screenshot(path=os.path.join(VIDEO_DIR, "13_truth_budget.png"))
        page.evaluate("window.scrollTo(0, 1000)")
        page.wait_for_timeout(2000)
        page.screenshot(path=os.path.join(VIDEO_DIR, "14_truth_evidence.png"))

        # ── Step 8: Design-to-Cost Simulator ────────────────────────────────
        print("Step 8: Design-to-Cost...")
        page.goto(f"{DEMO_URL}/engineer/design-to-cost", wait_until="networkidle", timeout=30000)
        page.wait_for_timeout(3000)
        page.screenshot(path=os.path.join(VIDEO_DIR, "15_design_to_cost.png"))

        # Scroll to show design changes
        page.evaluate("window.scrollTo(0, 500)")
        page.wait_for_timeout(2000)
        page.screenshot(path=os.path.join(VIDEO_DIR, "16_design_changes.png"))

        # ── Step 9: Quotation Intelligence ──────────────────────────────────
        print("Step 9: Quotation Intelligence...")
        page.goto(f"{DEMO_URL}/engineer/quotations", wait_until="networkidle", timeout=30000)
        page.wait_for_timeout(3000)
        page.screenshot(path=os.path.join(VIDEO_DIR, "17_quotations.png"))

        # ── Step 10: Payments ───────────────────────────────────────────────
        print("Step 10: Payments...")
        page.goto(f"{DEMO_URL}/engineer/payments", wait_until="networkidle", timeout=30000)
        page.wait_for_timeout(3000)
        page.screenshot(path=os.path.join(VIDEO_DIR, "18_payments.png"))

        # ── Step 11: Spatial / Map ──────────────────────────────────────────
        print("Step 11: Spatial...")
        page.goto(f"{DEMO_URL}/engineer/map", wait_until="networkidle", timeout=30000)
        page.wait_for_timeout(5000)
        page.screenshot(path=os.path.join(VIDEO_DIR, "19_spatial.png"))

        # ── Step 12: Validation ─────────────────────────────────────────────
        print("Step 12: Validation...")
        page.goto(f"{DEMO_URL}/engineer/validation", wait_until="networkidle", timeout=30000)
        page.wait_for_timeout(3000)
        page.screenshot(path=os.path.join(VIDEO_DIR, "20_validation.png"))

        # ── Step 13: Back to Dashboard ──────────────────────────────────────
        print("Step 13: Final dashboard view...")
        page.goto(f"{DEMO_URL}/engineer", wait_until="networkidle", timeout=30000)
        page.wait_for_timeout(3000)
        page.screenshot(path=os.path.join(VIDEO_DIR, "21_final_dashboard.png"))

        # ── Step 14: Homeowner View ─────────────────────────────────────────
        print("Step 14: Homeowner view...")
        page.goto(f"{DEMO_URL}/homeowner", wait_until="networkidle", timeout=30000)
        page.wait_for_timeout(3000)
        page.screenshot(path=os.path.join(VIDEO_DIR, "22_homeowner.png"))

        # Close
        context.close()
        browser.close()

    # Find the video file
    for f in os.listdir(VIDEO_DIR):
        if f.endswith(".webm"):
            video_path = os.path.join(VIDEO_DIR, f)
            size_mb = os.path.getsize(video_path) / (1024 * 1024)
            print(f"\n✅ Demo video recorded!")
            print(f"   File: {video_path}")
            print(f"   Size: {size_mb:.1f} MB")
            print(f"   Format: WebM (upload to YouTube/Loom directly)")
            return video_path

    print("\n⚠️ No video file found. Check screenshots in demo_videos folder.")
    return None


if __name__ == "__main__":
    record_demo()
