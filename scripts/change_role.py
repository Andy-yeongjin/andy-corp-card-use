"""
bkend 사용자 역할 변경 스크립트
사용법: python scripts/change_role.py
"""
import urllib.request
import json
import getpass
import os

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

def request(url, data=None, headers={}, method=None):
    body = json.dumps(data).encode() if data else None
    req = urllib.request.Request(url, data=body, headers=headers, method=method)
    res = urllib.request.urlopen(req)
    return json.loads(res.read())

def main():
    env = load_env()
    api_url  = env["NEXT_PUBLIC_BKEND_API_URL"]
    project  = env["NEXT_PUBLIC_BKEND_PROJECT_ID"]
    environ  = env["NEXT_PUBLIC_BKEND_ENVIRONMENT"]
    api_key  = env["BKEND_API_KEY"]

    print("=== bkend 사용자 역할 변경 ===")
    email    = input("관리자 이메일: ")
    password = getpass.getpass("PIN (4자리): ")

    # 로그인
    result = request(
        f"{api_url}/v1/auth/email/signin",
        data={"method": "password", "email": email, "password": f"Pin#{password}"},
        headers={"Content-Type": "application/json", "X-Project-Id": project, "X-Environment": environ},
    )
    token = result["data"]["accessToken"]
    base_headers = {
        "Content-Type": "application/json",
        "X-Project-Id": project,
        "X-Environment": environ,
        "X-API-Key": api_key,
        "Authorization": f"Bearer {token}",
    }

    # 사용자 목록
    req = urllib.request.Request(f"{api_url}/v1/users?limit=100", headers=base_headers)
    res = json.loads(urllib.request.urlopen(req).read())
    users = res["data"]["items"]

    print(f"\n총 {len(users)}명")
    print(f"{'#':<4} {'이름':<12} {'이메일':<30} {'현재역할'}")
    print("-" * 60)
    for i, u in enumerate(users, 1):
        print(f"{i:<4} {u.get('name',''):<12} {u['email']:<30} {u['role']}")

    # 대상 선택
    print()
    num = int(input("변경할 사용자 번호: ")) - 1
    target = users[num]

    print(f"\n대상: {target['email']} (현재: {target['role']})")
    print("역할 선택: 1) admin  2) user")
    choice = input("번호: ").strip()
    new_role = "admin" if choice == "1" else "user"

    # 역할 변경
    req = urllib.request.Request(
        f"{api_url}/v1/users/{target['id']}/role",
        data=json.dumps({"role": new_role}).encode(),
        headers=base_headers,
        method="PATCH",
    )
    res = json.loads(urllib.request.urlopen(req).read())

    if res.get("success"):
        print(f"\n✓ {target['email']} → {new_role} 변경 완료")
    else:
        print(f"\n✗ 실패: {res}")

if __name__ == "__main__":
    main()
