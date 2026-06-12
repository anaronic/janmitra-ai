#!/usr/bin/env python3
"""Keep a Render (or any) backend awake by pinging its health endpoint.

Render's free tier spins down after ~15 minutes of inactivity. Running this
keeps it warm. Uses only the Python standard library.

Usage:
    python scripts/keep_alive.py https://janmitra-backend.onrender.com
    # or set the URL via env var and run on a loop:
    BACKEND_URL=https://janmitra-backend.onrender.com python scripts/keep_alive.py --loop

Options:
    --loop                 Keep pinging forever (default: ping once and exit).
    --interval SECONDS     Seconds between pings when looping (default: 600).
    --path PATH            Health path to hit (default: /health).
"""
from __future__ import annotations

import argparse
import os
import sys
import time
import urllib.error
import urllib.request
from datetime import datetime, timezone


def ping(url: str, timeout: int = 60) -> int:
    req = urllib.request.Request(url, headers={"User-Agent": "janmitra-keepalive/1.0"})
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            return resp.status
    except urllib.error.HTTPError as exc:
        return exc.code
    except Exception as exc:  # network error, DNS, timeout, etc.
        print(f"  ping failed: {exc}", file=sys.stderr)
        return 0


def now() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%SZ")


def main() -> int:
    parser = argparse.ArgumentParser(description="Keep a backend awake by pinging /health.")
    parser.add_argument(
        "base_url",
        nargs="?",
        default=os.environ.get("BACKEND_URL", ""),
        help="Backend base URL (or set BACKEND_URL env var).",
    )
    parser.add_argument("--loop", action="store_true", help="Ping repeatedly instead of once.")
    parser.add_argument("--interval", type=int, default=600, help="Seconds between pings when looping.")
    parser.add_argument("--path", default="/health", help="Health endpoint path.")
    args = parser.parse_args()

    base = args.base_url.strip().rstrip("/")
    if not base:
        print("No backend URL provided. Pass it as an argument or set BACKEND_URL.", file=sys.stderr)
        return 2

    url = f"{base}{args.path if args.path.startswith('/') else '/' + args.path}"

    def one() -> int:
        status = ping(url)
        ok = 200 <= status < 400
        print(f"[{now()}] {url} -> {status} {'OK' if ok else 'DOWN'}")
        return status

    if not args.loop:
        status = one()
        return 0 if 200 <= status < 400 else 1

    print(f"Keeping {url} awake every {args.interval}s. Press Ctrl+C to stop.")
    try:
        while True:
            one()
            time.sleep(args.interval)
    except KeyboardInterrupt:
        print("Stopped.")
        return 0


if __name__ == "__main__":
    raise SystemExit(main())
