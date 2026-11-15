"""Check the actual emitted artifact against the published file limits."""
import hashlib
import json
import struct
import sys
from pathlib import Path

root = Path(sys.argv[1])
kit = Path(sys.argv[2])
game = root / 'game'
paths = list(game.rglob('*'))
assert len(paths) <= 993
assert all(not p.is_symlink() for p in paths)
assert sum(p.stat().st_size for p in paths if p.is_file()) <= 50331648
for name in ('three.module.min.js', 'three.core.min.js'):
    assert (game / 'vendor/three' / name).read_bytes() == (kit / 'starter/game/vendor/three' / name).read_bytes()
shots = sorted((root / 'screenshots').iterdir())
assert 3 <= len(shots) <= 4
for p in shots:
    data = p.read_bytes()
    assert data[:8] == b'\x89PNG\r\n\x1a\n'
    w, h = struct.unpack('>II', data[16:24])
    assert min(w, h) >= 480 and max(w, h) <= 1280, (p.name, w, h)
    assert len(data) <= 262144
    assert data[-12:] == b'\x00\x00\x00\x00IEND\xaeB`\x82'
assert (root / 'dossier.json').stat().st_size <= 1572864
json.loads((root / 'dossier.json').read_text())
manifest = {str(p.relative_to(root)): hashlib.sha256(p.read_bytes()).hexdigest() for p in sorted(root.rglob('*')) if p.is_file()}
print(json.dumps({'passed': True, 'files': len(manifest), 'screenshots': [p.name for p in shots], 'manifest': manifest}, indent=2))
