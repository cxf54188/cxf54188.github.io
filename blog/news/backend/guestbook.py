#!/usr/bin/env python3
"""大九班快报 · 留言追加工具（方案 A：纯静态）

用法：
    python3 guestbook.py add "昵称" "留言内容"

示例：
    python3 guestbook.py add "黄诗情" "运动会太燃了！"

说明：messages.json 是公开共享文件，追加后 push 到 GitHub，
      所有打开页面的人都能看到。恶意内容请勿录入。
"""
import json
import sys
from datetime import datetime
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
JSON_FILE = ROOT / "messages.json"

BAD_WORDS = ["垃圾", "废物", "傻逼", "滚"]  # 简单过滤，可按需扩充


def load_messages():
    if not JSON_FILE.exists():
        return []
    try:
        data = json.loads(JSON_FILE.read_text(encoding="utf-8"))
        return data.get("messages", [])
    except (json.JSONDecodeError, AttributeError):
        return []


def save_messages(msgs):
    JSON_FILE.write_text(
        json.dumps({"messages": msgs}, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )


def check_bad(text):
    return [w for w in BAD_WORDS if w in text]


def cmd_add(args):
    if len(args) < 2:
        print("用法: python3 guestbook.py add \"昵称\" \"留言内容\"")
        sys.exit(1)
    name, text = args[0].strip(), args[1].strip()
    if not name or not text:
        print("昵称和内容都不能为空")
        sys.exit(1)
    if len(name) > 20:
        print("昵称不能超过 20 字"); sys.exit(1)
    if len(text) > 300:
        print("留言不能超过 300 字"); sys.exit(1)

    hit = check_bad(name) + check_bad(text)
    if hit:
        print("内容包含不当词汇，已拒绝提交：", hit)
        sys.exit(1)

    msgs = load_messages()
    msgs.insert(0, {
        "name": name,
        "text": text,
        "time": datetime.now().strftime("%Y-%m-%d %H:%M"),
    })
    save_messages(msgs)
    print(f"✔ 已追加留言（共 {len(msgs)} 条）")


def main():
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(0)
    cmd = sys.argv[1]
    if cmd == "add":
        cmd_add(sys.argv[2:])
    else:
        print("未知命令:", cmd)
        print(__doc__)
        sys.exit(1)


if __name__ == "__main__":
    main()
