# server.py
from flask import Flask, request, jsonify
import csv
import os
import time

app = Flask(__name__)
LOGFILE = "keystroke_log.csv"

# ヘッダーがなければ追加
if not os.path.exists(LOGFILE):
    with open(LOGFILE, mode='w', newline='') as f:
        writer = csv.writer(f)
        writer.writerow(["timestamp", "char_count", "interval", "speed", "error_rate", "label"])

@app.route("/keystroke", methods=["POST"])
def receive_keystroke():
    data = request.get_json()

    # データの受け取りと保存
    with open(LOGFILE, mode='a', newline='') as f:
        writer = csv.writer(f)
        writer.writerow([
            time.time(),
            data.get("char_count", 0),
            data.get("interval", 0),
            data.get("speed", 0),
            data.get("error_rate", 0),
            data.get("label", "")  # 学習用ラベル（空でもOK）
        ])

    return jsonify({"status": "ok"})

if __name__ == "__main__":
    app.run(port=5000, debug=True)
