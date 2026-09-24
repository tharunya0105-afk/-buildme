"""
BuildMe - High-Definition Full Walkthrough Video Recorder
Records an automated, professional walkthrough of the entire BuildMe platform.
Captures key pages with smooth scrolling, realistic pacing, and interactive demonstrations.
"""
import os
import time
import shutil
from playwright.sync_api import sync_playwright

BASE_URL = os.environ.get("DEMO_URL", "http://localhost:3000")
OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "demo_videos")
SCREENSHOTS_DIR = os.path.join(OUTPUT_DIR, "screenshots")

os.makedirs(OUTPUT_DIR, exist_ok=True)
os.makedirs(SCREENSHOTS_DIR, exist_ok=True)


def smooth_scroll(page, scroll_amount=400, steps=8, delay_ms=100):
    step_size = scroll_amount / steps
    for _ in range(steps):
        page.evaluate(f"window.scrollBy({{ top: {step_size}, behavior: 'smooth' }})")
        page.wait_for_timeout(delay_ms)


def run_walkthrough():
    print("Starting BuildMe Full Walkthrough Video Recording...")
    print(f"Target URL: {BASE_URL}")
    print(f"Output Directory: {OUTPUT_DIR}")

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            viewport={"width": 1440, "height": 900},
            record_video_dir=OUTPUT_DIR,
            record_video_size={"width": 1440, "height": 900},
        )
        page = context.new_page()
        page.set_default_timeout(20000)

        # ── SCENE 1: Landing Page & Problem Statement ───────────────────────
        print("\n[1/13] Scene 1: Landing Page (Hero, Features, Impact)")
        page.goto(BASE_URL, wait_until="networkidle")
        page.wait_for_timeout(2500)
        page.screenshot(path=os.path.join(SCREENSHOTS_DIR, "01_landing_hero.png"))

        # Smooth scroll down to highlight value proposition
        smooth_scroll(page, scroll_amount=500, steps=10, delay_ms=80)
        page.wait_for_timeout(2000)
        page.screenshot(path=os.path.join(SCREENSHOTS_DIR, "02_landing_features.png"))

        smooth_scroll(page, scroll_amount=600, steps=10, delay_ms=80)
        page.wait_for_timeout(2000)
        page.screenshot(path=os.path.join(SCREENSHOTS_DIR, "03_landing_workflow.png"))

        page.evaluate("window.scrollTo({ top: 0, behavior: 'smooth' })")
        page.wait_for_timeout(1500)

        # ── SCENE 2: Login Page & Authentication ────────────────────────────
        print("\n[2/13] Scene 2: Secure Authentication")
        page.goto(f"{BASE_URL}/auth/login", wait_until="networkidle")
        page.wait_for_timeout(2000)
        page.screenshot(path=os.path.join(SCREENSHOTS_DIR, "04_login.png"))

        # Type credentials with realistic typing cadence
        email_field = page.locator("input[type=email]").first
        email_field.click()
        page.wait_for_timeout(400)
        email_field.type("engineer@buildme.demo", delay=40)
        page.wait_for_timeout(500)

        pw_field = page.locator("input[type=password]").first
        pw_field.click()
        page.wait_for_timeout(400)
        pw_field.type("demo1234", delay=50)
        page.wait_for_timeout(800)

        page.locator("button[type=submit]").first.click()
        page.wait_for_load_state("networkidle")
        page.wait_for_timeout(3000)

        # ── SCENE 3: Engineer Command Center / Dashboard ────────────────────
        print("\n[3/13] Scene 3: Engineer Command Center (Multi-Project Oversight)")
        page.screenshot(path=os.path.join(SCREENSHOTS_DIR, "05_dashboard_top.png"))
        page.wait_for_timeout(2500)

        # Scroll through attention items and project cards
        smooth_scroll(page, scroll_amount=450, steps=10, delay_ms=80)
        page.wait_for_timeout(2500)
        page.screenshot(path=os.path.join(SCREENSHOTS_DIR, "06_dashboard_projects.png"))

        smooth_scroll(page, scroll_amount=500, steps=10, delay_ms=80)
        page.wait_for_timeout(2500)

        # ── SCENE 4: Project Truth (Core Innovation) ────────────────────────
        print("\n[4/13] Scene 4: Project Truth & Budget Story")
        page.goto(f"{BASE_URL}/engineer/truth", wait_until="networkidle")
        page.wait_for_timeout(3000)
        page.screenshot(path=os.path.join(SCREENSHOTS_DIR, "07_project_truth.png"))

        # Scroll to show budget variance and breakdown
        smooth_scroll(page, scroll_amount=450, steps=10, delay_ms=80)
        page.wait_for_timeout(2500)
        page.screenshot(path=os.path.join(SCREENSHOTS_DIR, "08_truth_variance.png"))

        smooth_scroll(page, scroll_amount=500, steps=10, delay_ms=80)
        page.wait_for_timeout(2500)
        page.screenshot(path=os.path.join(SCREENSHOTS_DIR, "09_truth_evidence_chain.png"))

        # ── SCENE 5: Cost Intelligence Engine ───────────────────────────────
        print("\n[5/13] Scene 5: Cost Intelligence Engine (Government Benchmarks)")
        page.goto(f"{BASE_URL}/engineer/cost-intelligence", wait_until="networkidle")
        page.wait_for_timeout(3000)
        page.screenshot(path=os.path.join(SCREENSHOTS_DIR, "10_cost_intelligence.png"))

        smooth_scroll(page, scroll_amount=400, steps=8, delay_ms=80)
        page.wait_for_timeout(2500)

        # ── SCENE 6: Design-to-Cost Simulator ───────────────────────────────
        print("\n[6/13] Scene 6: Design-to-Cost Simulation")
        page.goto(f"{BASE_URL}/engineer/design-to-cost", wait_until="networkidle")
        page.wait_for_timeout(3000)
        page.screenshot(path=os.path.join(SCREENSHOTS_DIR, "11_design_to_cost.png"))

        smooth_scroll(page, scroll_amount=450, steps=10, delay_ms=80)
        page.wait_for_timeout(2500)

        # ── SCENE 7: Quotation Intelligence & Scope Analysis ────────────────
        print("\n[7/13] Scene 7: Quotation Intelligence & Scope Comparison")
        page.goto(f"{BASE_URL}/engineer/quotations", wait_until="networkidle")
        page.wait_for_timeout(3000)
        page.screenshot(path=os.path.join(SCREENSHOTS_DIR, "12_quotation_intel.png"))

        smooth_scroll(page, scroll_amount=500, steps=10, delay_ms=80)
        page.wait_for_timeout(2500)

        # ── SCENE 8: Site Inspections & Photo Analysis ──────────────────────
        print("\n[8/13] Scene 8: Site Inspections & AI Progress Tracking")
        page.goto(f"{BASE_URL}/engineer/inspections", wait_until="networkidle")
        page.wait_for_timeout(3000)
        page.screenshot(path=os.path.join(SCREENSHOTS_DIR, "13_inspections.png"))

        smooth_scroll(page, scroll_amount=400, steps=8, delay_ms=80)
        page.wait_for_timeout(2500)

        # ── SCENE 9: Spatial Map & Geographical Distribution ────────────────
        print("\n[9/13] Scene 9: Spatial Map & Site Distribution")
        page.goto(f"{BASE_URL}/engineer/map", wait_until="networkidle")
        page.wait_for_timeout(4000)
        page.screenshot(path=os.path.join(SCREENSHOTS_DIR, "14_spatial_map.png"))

        # ── SCENE 10: Workforce Management & Verified Check-ins ──────────────
        print("\n[10/13] Scene 10: Workforce Intelligence & Check-ins")
        page.goto(f"{BASE_URL}/engineer/workforce", wait_until="networkidle")
        page.wait_for_timeout(3000)
        page.screenshot(path=os.path.join(SCREENSHOTS_DIR, "15_workforce.png"))

        smooth_scroll(page, scroll_amount=450, steps=8, delay_ms=80)
        page.wait_for_timeout(2500)

        # ── SCENE 11: Milestone Payments & Cash Flow ────────────────────────
        print("\n[11/13] Scene 11: Payments & Milestone Cash Flow")
        page.goto(f"{BASE_URL}/engineer/payments", wait_until="networkidle")
        page.wait_for_timeout(3000)
        page.screenshot(path=os.path.join(SCREENSHOTS_DIR, "16_payments.png"))

        smooth_scroll(page, scroll_amount=400, steps=8, delay_ms=80)
        page.wait_for_timeout(2000)

        # ── SCENE 12: CEDI Demo Story & Innovation Narrative ────────────────
        print("\n[12/13] Scene 12: CEDI Demo Narrative & Pilot Metrics")
        page.goto(f"{BASE_URL}/engineer/cedi-demo", wait_until="networkidle")
        page.wait_for_timeout(3000)
        page.screenshot(path=os.path.join(SCREENSHOTS_DIR, "17_cedi_demo.png"))

        smooth_scroll(page, scroll_amount=500, steps=10, delay_ms=80)
        page.wait_for_timeout(2500)
        smooth_scroll(page, scroll_amount=600, steps=10, delay_ms=80)
        page.wait_for_timeout(2500)

        # ── SCENE 13: Homeowner Experience & Closing ────────────────────────
        print("\n[13/13] Scene 13: Homeowner Portal (Real-time Transparency)")
        page.goto(f"{BASE_URL}/homeowner", wait_until="networkidle")
        page.wait_for_timeout(3000)
        page.screenshot(path=os.path.join(SCREENSHOTS_DIR, "18_homeowner_portal.png"))

        smooth_scroll(page, scroll_amount=500, steps=10, delay_ms=80)
        page.wait_for_timeout(3000)

        # Finish and save video
        print("\n💾 Finalizing video file...")
        context.close()
        browser.close()

    # Find the recorded video and create a clean final file
    final_video_name = "buildme_full_walkthrough.webm"
    final_video_path = os.path.join(OUTPUT_DIR, final_video_name)

    latest_webm = None
    latest_time = 0
    for f in os.listdir(OUTPUT_DIR):
        if f.endswith(".webm") and f != final_video_name:
            full_p = os.path.join(OUTPUT_DIR, f)
            mtime = os.path.getmtime(full_p)
            if mtime > latest_time:
                latest_time = mtime
                latest_webm = full_p

    if latest_webm and os.path.exists(latest_webm):
        shutil.copy2(latest_webm, final_video_path)
        size_mb = os.path.getsize(final_video_path) / (1024 * 1024)
        print(f"\n[OK] Video Walkthrough Successfully Created!")
        print(f"   Final Video: {final_video_path}")
        print(f"   Size: {size_mb:.2f} MB")
        print(f"   Screenshots: {len(os.listdir(SCREENSHOTS_DIR))} captured in {SCREENSHOTS_DIR}")
        return final_video_path

    print("\n[NOTE] Recording completed. Output files stored in:", OUTPUT_DIR)
    return None


if __name__ == "__main__":
    run_walkthrough()
