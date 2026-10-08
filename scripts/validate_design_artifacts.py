"""Check static design integrity and magic-link form boundaries."""
import hashlib
import json
from html.parser import HTMLParser
from pathlib import Path


class Inputs(HTMLParser):
    def __init__(self):
        super().__init__()
        self.inputs = []

    def handle_starttag(self, tag, attrs):
        if tag == "input":
            self.inputs.append(dict(attrs))


def main():
    root = Path(__file__).resolve().parents[1] / "docs/design-artifacts/stitch"
    manifest = json.loads((root / "manifest.json").read_text())
    seen = set()
    auth_count = 0
    for screen in manifest["screens"]:
        assert screen["id"] not in seen, "Duplicate screen ID"
        seen.add(screen["id"])
        source = (root / screen["html"]).read_bytes()
        preview = (root / screen["screenshot"]).read_bytes()
        assert hashlib.sha256(source).hexdigest() == screen["sha256"]
        assert hashlib.sha256(preview).hexdigest() == screen["screenshotSha256"]
        assert preview.startswith(b"\xff\xd8\xff"), "Invalid JPEG"
        if "Magic Link" in screen["title"]:
            auth_count += 1
            parser = Inputs()
            parser.feed(source.decode())
            assert len(parser.inputs) == 1, "Auth must contain only email input"
            field = parser.inputs[0]
            assert field.get("type") == "email"
            assert field.get("autocomplete") == "email"
            assert not field.get("value"), "Auth must start blank"
            assert "Send me a magic link" in source.decode()
    assert auth_count == 2, "Desktop and mobile auth designs required"
    print(f"PASS: {len(seen)} static artifacts and magic-link form boundaries")


if __name__ == "__main__":
    main()
