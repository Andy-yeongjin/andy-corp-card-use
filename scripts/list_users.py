"""
bkend 사용자 목록 조회 스크립트
사용법: python scripts/list_users.py
"""
import urllib.request
import json
import getpass
import os

# .env.local 읽기
def load_env():
    env = {}
    env_path = os.path.join(os.path.dirname(__file__), "..", ".env.local")
    with open(env_path, encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                k, v = line.split("=", 1)
                env[k.strip()] = v.strip()
    return env

def request(url, data=None, headers={}):
    body = json.dumps(data).encode() if data else None
    req = urllib.request.Request(url, data=body, headers=headers)
    res = urllib.request.urlopen(req)
    return json.loads(res.read())

def main():
    env = load_env()
    api_url   = env["NEXT_PUBLIC_BKEND_API_URL"]
    project   = env["NEXT_PUBLIC_BKEND_PROJECT_ID"]
    environ   = env["NEXT_PUBLIC_BKEND_ENVIRONMENT"]
    api_key   = env["BKEND_API_KEY"]

    print("=== bkend 사용자 목록 ===")
    import sys
    if len(sys.argv) >= 3:
        email, password = sys.argv[1], sys.argv[2]
    else:
        email    = input("관리자 이메일: ")
        password = getpass.getpass("PIN (4자리): ")

    # 로그인
    result = request(
        f"{api_url}/v1/auth/email/signin",
        data={"method": "password", "email": email, "password": f"Pin#{password}"},
        headers={"Content-Type": "application/json", "X-Project-Id": project, "X-Environment": environ},
    )
    token = result["data"]["accessToken"]

    # 사용자 목록 조회
    req = urllib.request.Request(
        f"{api_url}/v1/users?limit=100&sortBy=createdAt&sortDirection=desc",
        headers={
            "Content-Type": "application/json",
            "X-Project-Id": project,
            "X-Environment": environ,
            "X-API-Key": api_key,
            "Authorization": f"Bearer {token}",
        }
    )
    res = json.loads(urllib.request.urlopen(req).read())
    users = res["data"]["items"]

    print(f"\n총 {len(users)}명\n")
    print(f"{'#':<4} {'이름':<12} {'이메일':<30} {'역할':<10} {'ID'}")
    print("-" * 75)
    for i, u in enumerate(users, 1):
        print(f"{i:<4} {u.get('name',''):<12} {u['email']:<30} {u['role']:<10} {u['id']}")

if __name__ == "__main__":
    main()
