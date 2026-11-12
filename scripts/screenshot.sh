#!/usr/bin/env bash
# 构建 dist 并用 Chrome headless 截图首页与各项目详情页
set -e
cd "$(dirname "$0")/.."

npm run build > /tmp/pf-build.log 2>&1 || { tail -20 /tmp/pf-build.log; exit 1; }

CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
OUT="${1:-/tmp/pf-shots}"
mkdir -p "$OUT"

# SPA fallback 静态服务
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

PORT=5188
python3 /tmp/pf-serve.py "$PWD/dist" $PORT &
SRV=$!
trap "kill $SRV 2>/dev/null" EXIT
sleep 2

shoot() {
  local path="$1" name="$2" h="${3:-1100}"
  "$CHROME" --headless --disable-gpu --hide-scrollbars \
    --window-size=1440,$h --virtual-time-budget=9000 \
    --screenshot="$OUT/$name.png" "http://127.0.0.1:$PORT$path" >/dev/null 2>&1
  echo "  $name.png  $(ls -la "$OUT/$name.png" 2>/dev/null | awk '{print $5}') bytes"
}

echo "screenshots -> $OUT"
shoot "/" "01-home-hero" 1000
shoot "/project/bidos" "02-bidos" 1200
shoot "/project/cga-smart" "03-cga" 1200
shoot "/project/moca" "04-moca" 1200
shoot "/project/fupan" "05-fupan" 1200
shoot "/project/polymed" "06-polymed" 1200
