"""
FactoriQ LinkedIn Post Generator
---------------------------------
Generates 60 LinkedIn posts (2/day for 30 days) across 6 IQ modules
using Google Gemini for text and Imagen 3 for images.

Usage:
    python generate_posts.py              # generate text + images
    python generate_posts.py --text-only  # generate text only (faster)
    python generate_posts.py --images-only # generate images for existing schedule.json
"""

import os
import sys
import json
import time
import base64
import argparse
from pathlib import Path
from datetime import datetime, timedelta
from dotenv import load_dotenv

load_dotenv()

try:
    from google import genai
    from google.genai import types
except ImportError:
    print("ERROR: google-genai not installed. Run: pip install -r requirements.txt")
    sys.exit(1)

# ──────────────────────────────────────────────
# CONFIG
# ──────────────────────────────────────────────
WEBSITE = "https://factoriqai.com"
START_DATE = datetime(2026, 3, 30)      # First post date
POST_TIMES = ["09:00", "18:00"]         # Morning + evening
TEXT_MODEL = "gemini-2.5-flash"
IMAGE_MODEL = "imagen-4.0-generate-001"

OUTPUT_DIR = Path(__file__).parent / "output"
IMAGES_DIR = OUTPUT_DIR / "images"
SCHEDULE_FILE = OUTPUT_DIR / "schedule.json"

# 6 modules × 10 posts = 60 total
MODULES = {
    "BuyIQ": {
        "description": "automated purchase order drafting, BOQ automation, intelligent PO approvals, and ERP write-back",
        "pain_points": [
            "buyers spending hours manually creating POs from spreadsheets",
            "PO approval cycles taking days due to missing info",
            "BOQ errors causing procurement delays and cost overruns",
            "ERP data entry being slow, error-prone and manual",
            "no visibility into open PO status across suppliers",
            "late deliveries caused by poorly structured purchase orders",
            "buyers unable to compare quotes automatically across vendors",
            "PO revisions creating chaos in production schedules",
            "manual three-way matching of PO, GRN and invoice",
            "procurement teams drowning in low-value PO creation tasks",
        ],
    },
    "SupplierIQ": {
        "description": "AI-powered supplier discovery, qualification scoring, and onboarding automation",
        "pain_points": [
            "sourcing teams spending weeks finding qualified suppliers for new categories",
            "no standardised way to score and compare supplier capabilities",
            "supplier onboarding taking months due to manual paperwork",
            "factories depending on 1-2 suppliers for critical components",
            "no centralised supplier database across plant locations",
            "supplier compliance documents expiring without anyone noticing",
            "new vendor qualification relying entirely on personal networks",
            "supplier risk profiles not updated after geopolitical disruptions",
            "inability to benchmark supplier pricing against market rates",
            "procurement teams lacking data to negotiate better terms",
        ],
    },
    "TenderIQ": {
        "description": "RFQ intelligence, tender analysis, vendor interview automation, and bid comparison",
        "pain_points": [
            "comparing bids from 10+ vendors taking days of manual work",
            "RFQ responses arriving in inconsistent formats making analysis hard",
            "tender evaluations being subjective and inconsistent across team members",
            "losing track of vendor clarifications and Q&A during tendering",
            "no audit trail for tender decisions when auditors ask questions",
            "buyers missing hidden costs buried in vendor bid documents",
            "RFQ preparation taking too long due to lack of templates",
            "vendor interviews producing inconsistent notes across evaluators",
            "shortlisting suppliers based on gut feel rather than data",
            "tender cycle taking 6-8 weeks when market moves in days",
        ],
    },
    "DemandIQ": {
        "description": "AI demand forecasting, MRP intelligence, inventory optimisation, and replenishment automation",
        "pain_points": [
            "MRP runs producing unreliable outputs that planners override manually",
            "stockouts of critical raw materials halting production lines",
            "excess inventory tying up working capital across warehouses",
            "demand spikes catching procurement teams completely off guard",
            "planners spending entire days recalculating reorder points in Excel",
            "seasonal demand patterns not being factored into procurement plans",
            "production schedule changes cascading into procurement chaos",
            "lead time variability causing safety stock calculations to fail",
            "no early warning system for potential material shortages",
            "ERP demand signals being ignored because planners don't trust them",
        ],
    },
    "ContractIQ": {
        "description": "contract intelligence, obligation tracking, risk clause detection, and renewal automation",
        "pain_points": [
            "vendor contracts auto-renewing at unfavourable rates without anyone noticing",
            "contract obligations buried in PDFs with no tracking system",
            "penalty clauses being triggered because team missed a deadline",
            "legal review of supplier contracts taking weeks for standard agreements",
            "no single source of truth for all active vendor contracts",
            "price escalation clauses kicking in without procurement being alerted",
            "contract terms not being enforced during actual purchase transactions",
            "auditors requesting contract evidence that no one can find quickly",
            "renegotiation opportunities missed because contract end dates slip by",
            "supply disruptions caused by expired SLA terms going unnoticed",
        ],
    },
    "RiskIQ": {
        "description": "supplier performance monitoring, risk scoring, disruption alerts, and supply chain resilience planning",
        "pain_points": [
            "supplier financial distress not discovered until they fail to deliver",
            "no early warning before a key supplier goes offline",
            "quality issues from a supplier repeating across multiple shipments",
            "geopolitical events disrupting single-source suppliers with no backup plan",
            "on-time delivery performance tracked manually in Excel per buyer",
            "supplier scorecard reviews happening annually instead of in real time",
            "risk concentrated in a single geography for critical components",
            "factory audits happening infrequently with no continuous monitoring",
            "delayed shipments discovered only when production is already impacted",
            "procurement teams reacting to supply chain crises instead of preventing them",
        ],
    },
}


# ──────────────────────────────────────────────
# HELPERS
# ──────────────────────────────────────────────

def init_client():
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        print("ERROR: GEMINI_API_KEY not set. Copy .env.example to .env and add your key.")
        sys.exit(1)
    return genai.Client(api_key=api_key)


def safe_call(fn, retries=3, delay=5):
    """Retry wrapper for API calls."""
    for attempt in range(retries):
        try:
            return fn()
        except Exception as e:
            if attempt < retries - 1:
                print(f"  Retry {attempt + 1}/{retries} after error: {e}")
                time.sleep(delay * (attempt + 1))
            else:
                raise


def build_schedule_slots():
    """Return list of (date_str, time_str) for 30 days × 2 posts."""
    slots = []
    for day in range(30):
        date = START_DATE + timedelta(days=day)
        date_str = date.strftime("%Y-%m-%d")
        for t in POST_TIMES:
            slots.append((date_str, t))
    return slots  # 60 slots


def build_post_sequence():
    """
    Build ordered list of (module, post_number, pain_point).
    Interleave modules so consecutive posts are always different modules.
    Pattern: rotate through all 6 modules; 10 rounds = 60 posts.
    """
    sequence = []
    module_names = list(MODULES.keys())
    counters = {m: 0 for m in module_names}

    for round_idx in range(10):          # 10 rounds × 6 modules = 60
        for module in module_names:
            counters[module] += 1
            pain = MODULES[module]["pain_points"][counters[module] - 1]
            sequence.append((module, counters[module], pain))
    return sequence  # 60 items


# ──────────────────────────────────────────────
# TEXT GENERATION
# ──────────────────────────────────────────────

POST_SYSTEM_PROMPT = """You are a B2B LinkedIn content writer for FactoriQ — an AI platform
that sits on top of any ERP to automate manufacturing procurement and supply chain operations.
Write sharp, specific, jargon-free posts that resonate with operations directors,
procurement heads, and plant managers in manufacturing companies."""

def generate_post_text(client, module: str, post_number: int, pain_point: str) -> dict:
    module_info = MODULES[module]

    prompt = f"""Write a LinkedIn post for FactoriQ's {module} module. This is post {post_number}/10 for this module.

**Module:** {module}
**What it does:** {module_info['description']}
**Specific pain point to address:** {pain_point}
**Website:** {WEBSITE}

Requirements:
- 150–200 words, professional LinkedIn tone
- Open with a specific operational scenario (not a generic statement)
- Name the exact pain point clearly in the first 2 sentences
- Explain how {module} solves it with 1-2 concrete outcomes
- Include a clear CTA linking to {WEBSITE}
- Use 2–3 relevant emojis (not excessive)
- End with 4–5 relevant hashtags on the last line
- Do NOT use phrases like "game-changer", "revolutionary", "cutting-edge", "leverage", or "in today's landscape"
- Each post must have a unique angle — avoid repeating the same framing as other posts

Return ONLY the post text. No commentary. No subject line. No "Here's the post:" prefix."""

    response = safe_call(
        lambda: client.models.generate_content(
            model=TEXT_MODEL,
            contents=prompt,
            config=types.GenerateContentConfig(
                system_instruction=POST_SYSTEM_PROMPT,
                temperature=0.85,
                max_output_tokens=512,
            ),
        )
    )

    text = response.text.strip()

    # Extract hashtags from the last line
    lines = [l.strip() for l in text.split("\n") if l.strip()]
    hashtag_line = lines[-1] if lines[-1].startswith("#") else ""
    hashtags = [w for w in hashtag_line.split() if w.startswith("#")]

    return {"content": text, "hashtags": hashtags}


# ──────────────────────────────────────────────
# IMAGE GENERATION
# ──────────────────────────────────────────────

IMAGE_STYLE = (
    "Professional B2B SaaS illustration, clean flat design, "
    "modern manufacturing operations setting, blue and teal color palette (#0A2540 deep navy, #00B4D8 teal, white), "
    "no text, no words, no logos, minimalist, LinkedIn-ready 16:9 format"
)

MODULE_VISUALS = {
    "BuyIQ": "a procurement officer reviewing automated purchase orders on a sleek dashboard, factory floor visible in background",
    "SupplierIQ": "a network graph connecting supplier nodes with quality score badges, supply chain map visualization",
    "TenderIQ": "multiple bid documents being analysed side-by-side on a modern screen, comparison charts",
    "DemandIQ": "demand forecast graph with inventory levels, warehouse shelves and production line in background",
    "ContractIQ": "contract documents with highlighted risk clauses, obligation timeline calendar, legal compliance theme",
    "RiskIQ": "supply chain risk heatmap dashboard, alert indicators, global supplier network with risk scores",
}

def generate_image_prompt(client, module: str) -> str:
    prompt = f"""Write a safe, clean image generation prompt for a professional B2B LinkedIn post image.

Topic: FactoriQ {module} — {MODULE_VISUALS[module]}

Rules:
- Describe an abstract, symbolic, or data-visualization style illustration only
- No people, no faces, no hands, no text in the image
- Use business/technology metaphors (dashboards, charts, connected nodes, data flows)
- Clean flat design, navy and teal color palette
- No factory machinery, no industrial equipment, no physical objects
- Suitable for a professional software company LinkedIn post

Return ONLY the image prompt (2 sentences). No explanation, no preamble."""

    response = safe_call(
        lambda: client.models.generate_content(
            model=TEXT_MODEL,
            contents=prompt,
            config=types.GenerateContentConfig(temperature=0.4, max_output_tokens=120),
        )
    )
    return response.text.strip()


def generate_image(client, image_prompt: str, output_path: Path) -> bool:
    """Generate image with Imagen 4 and save to output_path. Returns True on success."""
    try:
        response = safe_call(
            lambda: client.models.generate_images(
                model=IMAGE_MODEL,
                prompt=image_prompt,
                config=types.GenerateImagesConfig(
                    number_of_images=1,
                    aspect_ratio="16:9",
                    safety_filter_level="BLOCK_LOW_AND_ABOVE",
                    person_generation="DONT_ALLOW",
                ),
            )
        )
        if not response.generated_images:
            print(f"  WARNING: No images returned (likely blocked by safety filter)")
            return False
        img = response.generated_images[0].image
        if img is None or img.image_bytes is None:
            print(f"  WARNING: Image object is None (safety filter blocked this prompt)")
            return False
        output_path.write_bytes(img.image_bytes)
        return True
    except Exception as e:
        print(f"  WARNING: Image generation failed — {e}")
        return False


# ──────────────────────────────────────────────
# MAIN
# ──────────────────────────────────────────────

def generate_all(text_only=False, images_only=False, limit=10):
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    IMAGES_DIR.mkdir(parents=True, exist_ok=True)

    client = init_client()
    slots = build_schedule_slots()[:limit]          # (date, time) pairs
    sequence = build_post_sequence()[:limit]        # (module, post_number, pain_point)

    # ── IMAGES ONLY mode: load existing schedule ──
    if images_only:
        if not SCHEDULE_FILE.exists():
            print("ERROR: output/schedule.json not found. Run text generation first.")
            sys.exit(1)
        with open(SCHEDULE_FILE) as f:
            schedule = json.load(f)
        posts = schedule["posts"]
        print(f"\n[Images Only] Generating images for {len(posts)} existing posts...\n")
        for i, post in enumerate(posts, 1):
            img_path = OUTPUT_DIR / post["image_file"]
            if img_path.exists():
                print(f"  [{i:02d}/{len(posts)}] SKIP (already exists): {img_path.name}")
                continue
            print(f"  [{i:02d}/{len(posts)}] Generating image for post {post['post_id']} ({post['module']})...")
            img_prompt = post.get("image_prompt") or MODULE_VISUALS[post["module"]]
            success = generate_image(client, img_prompt, img_path)
            print(f"         {'✓ saved' if success else '✗ failed'}")
            time.sleep(2)

        with open(SCHEDULE_FILE, "w") as f:
            json.dump(schedule, f, indent=2, ensure_ascii=False)
        print(f"\nDone. Images saved to {IMAGES_DIR}/")
        return

    # ── FULL / TEXT-ONLY mode ──
    posts = []
    total = len(sequence)
    print(f"\nGenerating {total} posts...\n")

    for i, ((date_str, time_str), (module, post_number, pain_point)) in enumerate(
        zip(slots, sequence), 1
    ):
        post_id = f"{i:03d}"
        print(f"[{i:02d}/{total}] {date_str} {time_str} | {module} post {post_number}/10")

        # 1. Generate post text
        print(f"       Generating text...")
        text_data = generate_post_text(client, module, post_number, pain_point)
        time.sleep(1.5)  # rate limit

        # 2. Generate image prompt
        img_filename = f"post_{post_id}_{module.lower()}.png"
        img_relative = f"images/{img_filename}"
        img_absolute = IMAGES_DIR / img_filename
        img_prompt = ""

        if not text_only:
            print(f"       Generating image prompt...")
            img_prompt = generate_image_prompt(client, module)
            time.sleep(1)

            print(f"       Generating image...")
            success = generate_image(client, img_prompt, img_absolute)
            print(f"       {'✓ image saved' if success else '✗ image failed'}")
            time.sleep(2)

        post = {
            "post_id": post_id,
            "date": date_str,
            "time": time_str,
            "datetime": f"{date_str}T{time_str}:00",
            "module": module,
            "post_number": post_number,
            "pain_point": pain_point,
            "content": text_data["content"],
            "hashtags": text_data["hashtags"],
            "website": WEBSITE,
            "image_file": img_relative,
            "image_prompt": img_prompt,
            "image_generated": (not text_only) and img_absolute.exists(),
        }
        posts.append(post)

        # Save incrementally so progress is not lost
        _save_schedule(posts)

    _save_schedule(posts, final=True)
    print(f"\n{'='*50}")
    print(f"Done! {len(posts)} posts generated.")
    print(f"Schedule: {SCHEDULE_FILE}")
    if not text_only:
        generated = sum(1 for p in posts if p["image_generated"])
        print(f"Images:   {IMAGES_DIR}/ ({generated}/{len(posts)} generated)")
    print(f"{'='*50}\n")
    _print_summary(posts)


def _save_schedule(posts, final=False):
    schedule = {
        "generated_at": datetime.now().isoformat(),
        "total_posts": len(posts),
        "period": {
            "start": posts[0]["date"] if posts else "",
            "end": posts[-1]["date"] if posts else "",
        },
        "modules": {m: sum(1 for p in posts if p["module"] == m) for m in MODULES},
        "posts": posts,
    }
    with open(SCHEDULE_FILE, "w") as f:
        json.dump(schedule, f, indent=2, ensure_ascii=False)


def _print_summary(posts):
    print("Post distribution:")
    for module in MODULES:
        count = sum(1 for p in posts if p["module"] == module)
        print(f"  {module:15s} {count} posts")
    print()
    print("First 3 posts preview:")
    for post in posts[:3]:
        print(f"\n── {post['date']} {post['time']} | {post['module']} ──")
        print(post["content"][:300] + ("..." if len(post["content"]) > 300 else ""))


# ──────────────────────────────────────────────
# ENTRY POINT
# ──────────────────────────────────────────────

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="FactoriQ LinkedIn Post Generator")
    group = parser.add_mutually_exclusive_group()
    group.add_argument(
        "--text-only",
        action="store_true",
        help="Generate post text only, skip image generation",
    )
    group.add_argument(
        "--images-only",
        action="store_true",
        help="Generate images for an existing schedule.json",
    )
    parser.add_argument(
        "--limit",
        type=int,
        default=60,
        help="Number of posts to generate (default: 60)",
    )
    args = parser.parse_args()

    generate_all(text_only=args.text_only, images_only=args.images_only, limit=args.limit)
