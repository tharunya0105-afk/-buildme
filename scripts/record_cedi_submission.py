import os
import time
import shutil
from playwright.sync_api import sync_playwright

BASE_URL = 'http://localhost:3000'
OUTPUT_DIR = os.path.join(os.getcwd(), 'demo_videos')
FINAL_VIDEO_NAME = 'MeitY_GENESIS_EiR_Cohort3_Demo_BuildMe.webm'
os.makedirs(OUTPUT_DIR, exist_ok=True)

def smooth_scroll(page, start_y=0, end_y=1000, steps=12, delay_ms=100):
    delta = (end_y - start_y) / steps
    current = start_y
    for _ in range(steps):
        current += delta
        page.evaluate(f'window.scrollTo({{ top: {current}, behavior: "smooth" }})')
        page.wait_for_timeout(delay_ms)

def run_recording():
    print('Starting MeitY GENESIS EiR Cohort 3 Demo Video Recording...')
    print(f'Target URL: {BASE_URL}')

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            viewport={'width': 1440, 'height': 900},
            record_video_dir=OUTPUT_DIR,
            record_video_size={'width': 1440, 'height': 900},
        )
        page = context.new_page()
        page.set_default_timeout(25000)

        # ── SCENE 1: Upgraded Landing Page ──────────────────────────────────
        print('\n[Scene 1] Landing Page: Hero, Problem, Founder Story, Market, 90-Day Plan')
        page.goto(BASE_URL, wait_until='networkidle')
        page.wait_for_timeout(2500)

        # Hero
        smooth_scroll(page, start_y=0, end_y=450, steps=8, delay_ms=80)
        page.wait_for_timeout(1800)

        # Fast-track evaluator banner & stats
        smooth_scroll(page, start_y=450, end_y=950, steps=8, delay_ms=80)
        page.wait_for_timeout(2000)

        # Problem section (40-60% variance, 85% overrun rate)
        smooth_scroll(page, start_y=950, end_y=1600, steps=10, delay_ms=90)
        page.wait_for_timeout(2500)

        # System Architecture & Capabilities
        smooth_scroll(page, start_y=1600, end_y=2300, steps=10, delay_ms=90)
        page.wait_for_timeout(2500)

        # Founder Story (Son of civil engineer, no fake AI hype)
        smooth_scroll(page, start_y=2300, end_y=3100, steps=10, delay_ms=100)
        page.wait_for_timeout(3000)

        # Market & Scale (TAM ₹5.8 Lakh Cr, MeitY alignment)
        smooth_scroll(page, start_y=3100, end_y=3900, steps=10, delay_ms=100)
        page.wait_for_timeout(2500)

        # 30-60-90 Day CEDI Plan & Data Foundation
        smooth_scroll(page, start_y=3900, end_y=4700, steps=10, delay_ms=100)
        page.wait_for_timeout(2500)

        # Evaluator Callout CTA
        smooth_scroll(page, start_y=4700, end_y=5400, steps=8, delay_ms=80)
        page.wait_for_timeout(1800)

        # ── SCENE 2: Login Page with 1-Click Fill ────────────────────────────
        print('\n[Scene 2] Authentication & 1-Click Evaluator Login')
        page.goto(f'{BASE_URL}/auth/login', wait_until='networkidle')
        page.wait_for_timeout(2000)

        # Click the 1-Click Engineer Portal button
        engineer_demo_btn = page.locator('button:has-text("Engineer Portal")').first
        if engineer_demo_btn.is_visible():
            engineer_demo_btn.click()
            page.wait_for_timeout(1200)

        # Submit login
        submit_btn = page.locator('button[type="submit"]').first
        submit_btn.click()
        page.wait_for_timeout(3000)

        # ── SCENE 3: Engineer Dashboard ─────────────────────────────────────
        print('\n[Scene 3] Engineer Operational Dashboard')
        page.wait_for_load_state('networkidle')
        page.wait_for_timeout(2500)
        smooth_scroll(page, start_y=0, end_y=500, steps=8, delay_ms=80)
        page.wait_for_timeout(2000)

        # ── SCENE 4: CEDI Interactive Demo Walkthrough ──────────────────────
        print('\n[Scene 4] CEDI Demo: Kumar Residence Financial Story')
        page.goto(f'{BASE_URL}/engineer/cedi-demo', wait_until='networkidle')
        page.wait_for_timeout(2500)

        # Step 2: Cost Intelligence live estimate
        step2_btn = page.locator('button:has-text("2. Estimate")').first
        if step2_btn.is_visible():
            step2_btn.click()
            page.wait_for_timeout(1500)

            # Click Run Estimate
            run_btn = page.locator('button:has-text("Run Estimate")').first
            if run_btn.is_visible():
                run_btn.click()
                page.wait_for_timeout(2500)

        # Step 3: Methodology
        step3_btn = page.locator('button:has-text("3. Methodology")').first
        if step3_btn.is_visible():
            step3_btn.click()
            page.wait_for_timeout(2000)

        # Step 4: Spatial
        step4_btn = page.locator('button:has-text("4. Spatial")').first
        if step4_btn.is_visible():
            step4_btn.click()
            page.wait_for_timeout(2000)

        # Step 5: Quotations
        step5_btn = page.locator('button:has-text("5. Quotations")').first
        if step5_btn.is_visible():
            step5_btn.click()
            page.wait_for_timeout(2000)

        # Step 7: Design-to-Cost
        step7_btn = page.locator('button:has-text("7. Design-to-Cost")').first
        if step7_btn.is_visible():
            step7_btn.click()
            page.wait_for_timeout(2000)

        # Step 9: Payments
        step9_btn = page.locator('button:has-text("9. Payments")').first
        if step9_btn.is_visible():
            step9_btn.click()
            page.wait_for_timeout(2000)

        # Step 14: What's Proven
        step14_btn = page.locator("button:has-text(\"14. What's Proven\")").first
        if step14_btn.is_visible():
            step14_btn.click()
            page.wait_for_timeout(2000)

        # Step 15: What's NOT Proven (Intellectual Honesty)
        step15_btn = page.locator("button:has-text(\"15. What's Not\")").first
        if step15_btn.is_visible():
            step15_btn.click()
            page.wait_for_timeout(2000)

        # Step 16: Summary
        step16_btn = page.locator('button:has-text("16. Summary")').first
        if step16_btn.is_visible():
            step16_btn.click()
            page.wait_for_timeout(2500)

        # ── SCENE 5: Homeowner Portal Transparency ──────────────────────────
        print('\n[Scene 5] Homeowner Visibility Portal')
        # Sign in as the homeowner so /homeowner is reachable (role-guarded)
        page.goto(f'{BASE_URL}/auth/login', wait_until='networkidle')
        page.wait_for_timeout(2000)
        homeowner_btn = page.locator('button:has-text("Homeowner Portal")').first
        if homeowner_btn.is_visible():
            homeowner_btn.click()
            page.wait_for_timeout(1000)
        submit_btn = page.locator('button[type="submit"]').first
        submit_btn.click()
        page.wait_for_load_state('networkidle')
        page.wait_for_timeout(3000)

        page.goto(f'{BASE_URL}/homeowner', wait_until='networkidle')
        page.wait_for_timeout(3000)
        smooth_scroll(page, start_y=0, end_y=500, steps=8, delay_ms=80)
        page.wait_for_timeout(2000)

        # Return to landing page finale
        page.goto(BASE_URL, wait_until='networkidle')
        page.wait_for_timeout(2500)

        # Save video path before closing context
        video_path = page.video.path()
        context.close()
        browser.close()

        final_target = os.path.join(OUTPUT_DIR, FINAL_VIDEO_NAME)
        if os.path.exists(video_path):
            shutil.copy(video_path, final_target)
            size_mb = os.path.getsize(final_target) / (1024 * 1024)
            print(f'\n SUCCESS! Video successfully recorded and saved to:')
            print(f'   Path: {final_target}')
            print(f'   Size: {size_mb:.2f} MB')

if __name__ == '__main__':
    run_recording()
