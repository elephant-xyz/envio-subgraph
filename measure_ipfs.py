#!/usr/bin/env python3
import re, sys

log_path = sys.argv[1] if len(sys.argv) > 1 else "ipgs.log"

pat_ts = re.compile(r"^\[(\d\d):(\d\d):(\d\d)\.(\d{3})\]")
pat_dur = re.compile(r"durationMs:\s*(\d+)")

def to_seconds(h, m, s, ms):
    return h*3600 + m*60 + s + ms/1000.0

rows = []
with open(log_path, "r", errors="ignore") as f:
    last_ts = None
    for line in f:
        m = pat_ts.match(line)
        if m:
            h, mn, s, ms = map(int, m.groups())
            last_ts = to_seconds(h, mn, s, ms)
            continue
        d = pat_dur.search(line)
        if d and last_ts is not None:
            rows.append((last_ts, int(d.group(1))))

n = len(rows)
if n == 0:
    print("No IPFS fetch entries found.")
    sys.exit(0)

rows.sort()
span = max(rows)[0] - min(rows)[0]
span = span if span > 0 else 1.0
avg_ms = sum(d for _, d in rows) / n
rps = n / span
implied_concurrency = rps * (avg_ms / 1000.0)

print(f"Throughput: {rps:.2f} requests/sec ({n} requests / {span:.3f} s)")
print(f"Avg latency: ~{avg_ms:.1f} ms/request")
print(f"Implied avg concurrency: ~{implied_concurrency:.0f} in-flight ({rps:.2f} × {avg_ms/1000.0:.4f} s)")