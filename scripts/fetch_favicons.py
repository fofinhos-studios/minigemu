#!/usr/bin/env python3
"""Fetch supported-game favicons into public/favicons."""

from __future__ import annotations

import re
import sys
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urljoin
from urllib.request import Request, urlopen

ROOT = Path(__file__).resolve().parents[1]
OUTPUT_DIR = ROOT / "public" / "favicons"
USER_AGENT = "daily-game-tracker-favicon-fetcher/1.0"
GAMES = {
    "anthropeum": "https://anthropeum.com/",
    "conexo": "https://conexo.ws",
    "cutle": "https://pfiffel.com/cutle/",
    "expresso": "https://expresso.ac",
    "framed": "https://framed.wtf",
    "gamedle": "https://gamedle.wtf",
    "guessthegame": "https://guessthe.game",
    "letroso": "https://letroso.com",
    "sizeitup": "https://magnitudle.com/size-it-up",
    "termo": "https://term.ooo",
    "timeguessr": "https://timeguessr.com/",
}


class IconParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self.icons: list[str] = []

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        if tag.lower() != "link":
            return
        values = {key.lower(): value for key, value in attrs if value}
        rel = values.get("rel", "").lower()
        href = values.get("href")
        if href and "icon" in rel:
            self.icons.append(href)


def fetch(url: str) -> tuple[bytes, str]:
    request = Request(url, headers={"User-Agent": USER_AGENT})
    with urlopen(request, timeout=20) as response:
        return response.read(), response.headers.get_content_type()


def icon_candidates(site_url: str) -> list[str]:
    candidates: list[str] = []
    try:
        html, _ = fetch(site_url)
        parser = IconParser()
        parser.feed(html.decode("utf-8", errors="ignore"))
        candidates.extend(urljoin(site_url, icon) for icon in reversed(parser.icons))
    except Exception as error:
        print(f"  page inspection failed: {error}", file=sys.stderr)
    candidates.append(urljoin(site_url, "/favicon.ico"))
    return list(dict.fromkeys(candidates))


def is_image(data: bytes, content_type: str) -> bool:
    return (
        content_type.startswith("image/")
        or data.startswith(b"\x00\x00\x01\x00")
        or data.startswith(b"\x89PNG\r\n\x1a\n")
        or data.startswith((b"GIF87a", b"GIF89a", b"\xff\xd8\xff"))
        or re.match(rb"\s*<svg[\s>]", data, re.IGNORECASE) is not None
    )


def main() -> int:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    failures = 0

    for game, site_url in GAMES.items():
        target = OUTPUT_DIR / (f"{game}.png" if game in {"cutle", "sizeitup"} else f"{game}.ico")
        candidates = (
            ["https://magnitudle.com/icon-magnitude.png"]
            if game == "sizeitup"
            else icon_candidates(site_url)
        )
        for candidate in candidates:
            try:
                data, content_type = fetch(candidate)
                if not data or not is_image(data, content_type):
                    continue
                if game in {"cutle", "sizeitup"} and not data.startswith(b"\x89PNG\r\n\x1a\n"):
                    continue
                target.write_bytes(data)
                print(f"{game}: {candidate} -> {target.relative_to(ROOT)}")
                break
            except Exception:
                continue
        else:
            failures += 1
            print(f"{game}: no favicon found", file=sys.stderr)

    return 1 if failures else 0


if __name__ == "__main__":
    raise SystemExit(main())
