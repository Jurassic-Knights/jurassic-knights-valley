#!/usr/bin/env python3
"""Find all JS files over 500 lines."""
from pathlib import Path

SRC = Path(__file__).parent.parent / "src"

results = []
for js_file in SRC.rglob("*.js"):
    lines = len(js_file.read_text(encoding="utf-8", errors="ignore").splitlines())
    if lines > 500:
        rel = str(js_file.relative_to(SRC.parent))
        results.append((lines, rel))

results.sort(key=lambda x: -x[0])

print(f"\nFiles over 500 lines ({len(results)} found):\n")
print(f"{'Lines':>6}  File")
print("-" * 60)
for lines, path in results:
    print(f"{lines:>6}  {path}")
