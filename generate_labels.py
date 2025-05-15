import pandas as pd

# --- パラメータ設定 ---
BASELINE_SPEED = 200  # sensuさんの通常速度（文字/分）を基準とします（必要に応じて調整）
PAUSE_THRESHOLD = 5   # 秒
ERROR_RATE_THRESHOLD = 5  # %

# --- 擬似ラベル生成関数 ---
def auto_label(speed, error_rate, interval, baseline_speed=BASELINE_SPEED):
    labels = []

    if interval > PAUSE_THRESHOLD:
        labels.append("pause")
    if speed < baseline_speed * 0.8:
        labels.append("low_energy")
    if speed > baseline_speed * 1.2:
        labels.append("high_arousal")
    if error_rate > ERROR_RATE_THRESHOLD:
        labels.append("high_error")
    if not labels:
        labels.append("normal")

    return "_".join(labels)

# --- CSVの読み込み ---
df = pd.read_csv("keystroke_log.csv")

# --- 欠損行を削除 ---
df = df.dropna()

# --- 擬似ラベル列の追加 ---
df["auto_label"] = df.apply(lambda row: auto_label(
    row["speed"],
    row["error_rate"],
    row["interval"]
), axis=1)

# --- 結果の保存 ---
df.to_csv("keystroke_labeled.csv", index=False)
print("✅ 擬似ラベル付きデータを保存しました: keystroke_labeled.csv")
