#!/usr/bin/env bash
# 按滚动位置截取整页长图（分段），用于检查首页各区块
set -e
cd "$(dirname "$0")/.."
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
OUT="${1:-/tmp/pf-shots}"
mkdir -p "$OUT"

cat > /tmp/pf-serve.py <<'PY'
import http.server, os, socketserver, sys
root = sys.argv[1]; port = int(sys.argv[2])
class H(http.server.SimpleHTTPRequestHandler):
    def __init__(self,*a,**k): super().__init__(*a, directory=root, **k)
    def do_GET(self):
        p = self.translate_path(self.path)
        if not os.path.exists(p) or os.path.isdir(p):
            if '.' not in os.path.basename(self.path):
                self.path = '/index.html'
        return super().do_GET()
    def log_message(self,*a): pass
socketserver.TCPServer.allow_reuse_address = True
with socketserver.TCPServer(("127.0.0.1", port), H) as httpd:
    httpd.serve_forever()
PY

PORT=5189
python3 /tmp/pf-serve.py "$PWD/dist" $PORT &
SRV=$!
trap "kill $SRV 2>/dev/null" EXIT
sleep 2

# 用 CDP 滚动到指定锚点截图
shot_at() {
  local name="$1" anchor="$2"
  "$CHROME" --headless --disable-gpu --hide-scrollbars \
    --window-size=1440,1000 --virtual-time-budget=9000 \
    --screenshot="$OUT/$name.png" \
    "http://127.0.0.1:$PORT/#$anchor" >/dev/null 2>&1
  echo "  $name.png $(ls -la "$OUT/$name.png" | awk '{print $5}') bytes"
}

shot_at "10-about" "about"
shot_at "11-capabilities" "capabilities"
shot_at "12-projects" "projects"
shot_at "13-research" "research"
shot_at "14-contact" "contact"
