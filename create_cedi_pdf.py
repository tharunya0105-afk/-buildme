"""
Generate CEDI EiR Cohort 3 Application PDF from BuildMe screenshots.
Creates a professional PDF portfolio of the BuildMe product.
"""
import os
from fpdf import FPDF
from PIL import Image

SCREENSHOT_DIR = os.path.join(os.path.dirname(__file__), "cedi_screenshots")
OUTPUT_PDF = os.path.join(os.path.dirname(__file__), "BuildMe_CEDI_EiR_Application_Screenshots.pdf")

class CediPDF(FPDF):
    def header(self):
        self.set_font("Helvetica", "B", 10)
        self.set_text_color(100, 100, 100)
        self.cell(0, 8, "BuildMe - Construction Intelligence Platform | CEDI EiR Cohort 3", align="C")
        self.ln(10)

    def footer(self):
        self.set_y(-15)
        self.set_font("Helvetica", "", 8)
        self.set_text_color(150, 150, 150)
        self.cell(0, 10, f"Page {self.page_no()}/{{nb}}", align="C")

    def cover_page(self):
        self.add_page()
        self.ln(50)
        self.set_font("Helvetica", "B", 32)
        self.set_text_color(20, 30, 60)
        self.cell(0, 15, "BuildMe", ln=True, align="C")
        
        self.ln(5)
        self.set_font("Helvetica", "", 16)
        self.set_text_color(80, 80, 80)
        self.cell(0, 10, "Construction Intelligence Platform", ln=True, align="C")
        
        self.ln(15)
        self.set_font("Helvetica", "", 12)
        self.set_text_color(60, 60, 60)
        lines = [
            "Know what your house will cost before you build it.",
            "",
            "GENESIS Entrepreneur-in-Residence (EiR) Cohort 3",
            "Product Portfolio & Screenshot Evidence",
            "",
            "Connects design decisions, contractor quotations,",
            "site progress, and budget tracking in one place.",
            "",
            "Built for independent civil engineers",
            "managing multiple residential construction projects.",
        ]
        for line in lines:
            self.cell(0, 8, line, ln=True, align="C")

        self.ln(20)
        self.set_font("Helvetica", "B", 11)
        self.set_text_color(30, 80, 150)
        stats = [
            "12 Real Quotations  |  16 TN BCCI Centres  |  54 Line Items  |  79/79 Tests Passing",
            "80 Pages  |  0 TypeScript Errors  |  Cost Estimation Engine  |  Risk Intelligence",
        ]
        for s in stats:
            self.cell(0, 8, s, ln=True, align="C")

    def section_title(self, title, subtitle=""):
        self.ln(8)
        self.set_font("Helvetica", "B", 14)
        self.set_text_color(20, 30, 60)
        self.cell(0, 10, title, ln=True)
        if subtitle:
            self.set_font("Helvetica", "", 10)
            self.set_text_color(100, 100, 100)
            self.cell(0, 6, subtitle, ln=True)
        self.ln(3)

    def add_screenshot(self, filepath, caption, max_height=140):
        """Add a screenshot with caption, fitting it on the page."""
        if not os.path.exists(filepath):
            self.set_font("Helvetica", "I", 10)
            self.set_text_color(200, 50, 50)
            self.cell(0, 8, f"[Screenshot not available: {os.path.basename(filepath)}]", ln=True)
            return

        img = Image.open(filepath)
        img_w, img_h = img.size
        
        # Available width (A4 = 210mm, margins = 15mm each side)
        available_w = 180  # mm
        # Scale to fit
        scale = available_w / img_w if img_w > 0 else 1
        display_w = available_w
        display_h = img_h * scale

        # If too tall, scale down further
        max_h_mm = max_height
        if display_h > max_h_mm:
            scale2 = max_h_mm / display_h
            display_h *= scale2
            display_w *= scale2

        # Check if we need a new page
        if self.get_y() + display_h + 20 > 290:
            self.add_page()

        # Caption
        self.set_font("Helvetica", "B", 10)
        self.set_text_color(30, 30, 30)
        self.cell(0, 7, caption, ln=True)
        self.ln(2)

        # Center the image
        x_pos = (210 - display_w) / 2
        self.image(filepath, x=x_pos, w=display_w, h=display_h)
        self.ln(5)


def build_pdf():
    pdf = CediPDF(orientation="P", unit="mm", format="A4")
    pdf.alias_nb_pages()
    pdf.set_auto_page_break(auto=True, margin=20)

    # Cover page
    pdf.cover_page()

    # Page 2: Product Overview
    pdf.add_page()
    pdf.section_title("Product Overview", "What BuildMe does and who it is for")
    
    pdf.set_font("Helvetica", "", 10)
    pdf.set_text_color(40, 40, 40)
    overview = [
        "BuildMe is a Construction Financial Truth Engine for independent civil engineers",
        "managing residential construction projects in Tamil Nadu, India.",
        "",
        "Core Concept:",
        "  Connects what was planned, what was quoted, what changed, what was built,",
        "  what was paid, and why the budget moved.",
        "",
        "Primary Customer:",
        "  Independent/freelance civil engineers managing 2-10 residential projects",
        "",
        "Key Capabilities:",
        "  1. Cost Intelligence - Benchmark-based estimation using CPWD govt data + TN BCCI indices",
        "  2. Quotation Intelligence - Structure, compare, and analyze contractor quotations",
        "  3. Design-to-Cost - Simulate how design changes affect project budget",
        "  4. Project Truth - Every budget change explained, every payment linked to evidence",
        "  5. Evidence-Based Progress - OBSERVED/INFERRED/NOT VERIFIABLE framework",
        "  6. Payment Transparency - Homeowners understand WHY they are being asked for money",
        "  7. Spatial Intelligence - GPS-based site proximity and logistics analysis",
        "  8. Risk Intelligence - Rule-based risk scoring from project data",
        "",
        "Technical Stack:",
        "  Next.js 16, React 19, TypeScript, Tailwind CSS 4, Prisma, SQLite,",
        "  NextAuth.js, Leaflet/OpenStreetMap, Government benchmark databases",
    ]
    for line in overview:
        pdf.cell(0, 5.5, line, ln=True)

    # Screenshots section
    screenshot_pages = [
        ("01_landing_hero.png", "1. Landing Page - Hero Message", 
         "The core value proposition: 'Know what your house will cost before you build it.'"),
        ("02_landing_full.png", "2. Landing Page - Full Features & Data Stats",
         "Real data stats (12 quotations, 16 BCCI centres, 54 line items, 79/79 tests), feature cards, and workflow visualization."),
        ("03_login.png", "3. Authentication - Demo Credentials",
         "Working authentication with demo credentials for engineer and homeowner roles."),
        ("04_engineer_dashboard.png", "4. Engineer Dashboard - Command Center",
         "Real-time action queue with overdue inspections, open issues, and evidence gaps. 6 active projects with status indicators."),
        ("05_cedi_demo.png", "5. CEDI Demo - Product Story",
         "Kumar Residence walkthrough: Planned 45L + Site Found 72K + Changed 2.3L = Current 47.3L at 60% progress."),
        ("06_cost_intelligence.png", "6. Cost Intelligence - Estimation Engine",
         "Benchmark-based estimation with CPWD government data, TN BCCI indices, and real quotation evidence. Engine v1.0 transparent methodology."),
        ("07_project_truth.png", "7. Project Truth - Financial Tracking",
         "Complete financial story of Kumar Residence: budget changes, change requests, site context, risk intelligence, and evidence chain."),
        ("08_design_to_cost.png", "8. Design-to-Cost Simulator",
         "Interactive budget simulator: Add Bathroom (80K-1.5L), Add Floor (8L-15L), Premium Tiles, Granite Kitchen Top, and more."),
        ("09_quotation_intel.png", "9. Quotation Intelligence",
         "Scope analysis, comparison, and gap identification across contractor quotations."),
    ]

    for filename, title, description in screenshot_pages:
        pdf.add_page()
        pdf.section_title(title, description)
        filepath = os.path.join(SCREENSHOT_DIR, filename)
        # Use full page height for screenshots
        pdf.add_screenshot(filepath, "", max_height=160)

    # Final page: Data Integrity & Honesty
    pdf.add_page()
    pdf.section_title("Data Integrity & Transparency", "What is real, what is prototype, what is future")
    
    pdf.set_font("Helvetica", "", 10)
    pdf.set_text_color(40, 40, 40)
    integrity = [
        "WHAT IS PROVEN (Working, connected to real data):",
        "  - Cost estimation engine using CPWD benchmarks + TN BCCI indices",
        "  - Quotation import and scope analysis (12 real quotations)",
        "  - Budget tracking and change request workflow",
        "  - Risk intelligence (rule-based, not ML)",
        "  - Spatial intelligence (GPS + OpenStreetMap)",
        "  - Evidence chain tracking",
        "  - 79/79 automated tests passing deterministically",
        "",
        "WHAT IS WORKING PROTOTYPE (Architecture ready, needs more validation):",
        "  - Payment transparency with milestone-linked requests",
        "  - AI progress analysis framework",
        "  - Historical cost simulator",
        "",
        "WHAT IS FUTURE (Concept, insufficient data):",
        "  - ML-based cost prediction (needs completed project dataset)",
        "  - Regional intelligence across all Indian states",
        "  - Automated defect detection",
        "",
        "IMPORTANT DISCLAIMER:",
        "  BuildMe is NOT a supervised ML model.",
        "  It does NOT predict final construction costs.",
        "  It provides transparent benchmark-based estimates using government data.",
        "  Actual costs vary with design, specifications, materials, labour,",
        "  site conditions, and market changes.",
        "",
        "Built with honesty as a core principle.",
        "An evaluator should trust the product because it clearly states",
        "what it does and does not do.",
    ]
    for line in integrity:
        pdf.cell(0, 5.5, line, ln=True)

    # Save
    pdf.output(OUTPUT_PDF)
    size_mb = os.path.getsize(OUTPUT_PDF) / (1024 * 1024)
    print(f"PDF generated: {OUTPUT_PDF}")
    print(f"Size: {size_mb:.1f} MB")
    print(f"Pages: {pdf.page_no()}")

if __name__ == "__main__":
    build_pdf()
