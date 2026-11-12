#!/usr/bin/env python3
"""阿里云 DNS API 最小客户端（RPC 风格签名），用于 DNS-01 签发证书。"""
import hashlib
import hmac
import base64
import json
import time
import urllib.parse
import urllib.request

ENDPOINT = "alidns.aliyuncs.com"
API_VERSION = "2015-01-09"


def _percent_encode(s: str) -> str:
    return urllib.parse.quote(s, safe="")


def _sign(params: dict, secret: str) -> str:
    canon = "&".join(
        f"{_percent_encode(k)}={_percent_encode(str(params[k]))}" for k in sorted(params)
    )
    string_to_sign = "GET&%s&%s" % (_percent_encode("/"), _percent_encode(canon))
    h = hmac.new(
        (secret + "&").encode(), string_to_sign.encode(), hashlib.sha1
    ).digest()
    return base64.b64encode(h).decode()


def call(action: str, access_key_id: str, access_key_secret: str, **extra) -> dict:
    params = {
        "Action": action,
        "Format": "JSON",
        "Version": API_VERSION,
        "AccessKeyId": access_key_id,
        "SignatureMethod": "HMAC-SHA1",
        "SignatureNonce": f"{int(time.time() * 1000)}-{id(object())}",
        "SignatureVersion": "1.0",
        "Timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
    }
    params.update(extra)
    params["Signature"] = _sign(params, access_key_secret)

    url = f"https://{ENDPOINT}/?" + urllib.parse.urlencode(params)
    req = urllib.request.Request(url, headers={"User-Agent": "pf-deploy"})
    with urllib.request.urlopen(req, timeout=30) as resp:
        return json.loads(resp.read().decode())


if __name__ == "__main__":
    import os
    import sys

    ak = os.environ.get("ALIBABA_CLOUD_ACCESS_KEY_ID")
    sk = os.environ.get("ALIBABA_CLOUD_ACCESS_KEY_SECRET")
    if not ak or not sk:
        print("missing access key env")
        sys.exit(1)

    action = sys.argv[1] if len(sys.argv) > 1 else "DescribeDomainRecords"
    extra = {}
    if len(sys.argv) > 2:
        extra["DomainName"] = sys.argv[2]
    try:
        print(
            json.dumps(call(action, ak, sk, **extra), ensure_ascii=False, indent=2)[:1500]
        )
    except Exception as e:
        print("ERROR:", e)
        if hasattr(e, "read"):
            print(e.read().decode()[:800])
