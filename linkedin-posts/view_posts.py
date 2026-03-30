"""
View generated LinkedIn posts from schedule.json
Usage:
    python view_posts.py                  # show all posts (paginated)
    python view_posts.py --module BuyIQ   # filter by module
    python view_posts.py --date 2026-03-30
    python view_posts.py --post 001       # show specific post by ID
"""

import json
import argparse
import sys
from pathlib import Path

SCHEDULE_FILE = Path(__file__).parent / "output" / "schedule.json"
SEPARATOR = "─" * 60


def load_schedule():
    if not SCHEDULE_FILE.exists():
        print("No schedule.json found. Run generate_posts.py first.")
        sys.exit(1)
    with open(SCHEDULE_FILE) as f:
        return json.load(f)


def print_post(post, show_image_status=True):
    img_status = "✓ image" if post.get("image_generated") else "○ no image"
    print(f"\n{SEPARATOR}")
    print(f"POST {post['post_id']}  |  {post['date']} {post['time']}  |  {post['module']} #{post['post_number']}/10  |  {img_status}")
    print(f"Pain point: {post['pain_point']}")
    print(SEPARATOR)
    print(post["content"])
    if post.get("image_file"):
        print(f"\n[Image: {post['image_file']}]")


def main():
    parser = argparse.ArgumentParser(description="View FactoriQ LinkedIn posts")
    parser.add_argument("--module", help="Filter by module (e.g. BuyIQ)")
    parser.add_argument("--date", help="Filter by date (e.g. 2026-03-30)")
    parser.add_argument("--post", help="Show specific post by ID (e.g. 001)")
    parser.add_argument("--summary", action="store_true", help="Show schedule summary only")
    args = parser.parse_args()

    schedule = load_schedule()
    posts = schedule["posts"]

    # Summary
    print(f"\nFactoriQ LinkedIn Schedule")
    print(f"Generated: {schedule['generated_at'][:10]}")
    print(f"Period:    {schedule['period']['start']} → {schedule['period']['end']}")
    print(f"Total:     {schedule['total_posts']} posts")
    print(f"Modules:   {', '.join(f'{k}({v})' for k, v in schedule['modules'].items())}")
    images_done = sum(1 for p in posts if p.get("image_generated"))
    print(f"Images:    {images_done}/{len(posts)} generated")

    if args.summary:
        return

    # Filters
    if args.post:
        post_id = args.post.zfill(3)
        matches = [p for p in posts if p["post_id"] == post_id]
        if not matches:
            print(f"\nPost {post_id} not found.")
        else:
            print_post(matches[0])
        return

    if args.module:
        posts = [p for p in posts if p["module"].lower() == args.module.lower()]
        if not posts:
            print(f"\nNo posts found for module: {args.module}")
            return

    if args.date:
        posts = [p for p in posts if p["date"] == args.date]
        if not posts:
            print(f"\nNo posts found for date: {args.date}")
            return

    # Paginated display
    print(f"\nShowing {len(posts)} posts. Press Enter to continue, q to quit.\n")
    for i, post in enumerate(posts):
        print_post(post)
        if (i + 1) % 3 == 0 and i < len(posts) - 1:
            try:
                inp = input("\n[Enter] next  [q] quit: ").strip().lower()
                if inp == "q":
                    break
            except (EOFError, KeyboardInterrupt):
                break

    print(f"\n{SEPARATOR}")
    print("Done.")


if __name__ == "__main__":
    main()
