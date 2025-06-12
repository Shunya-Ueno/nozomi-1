import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, confusion_matrix
import matplotlib.pyplot as plt
import seaborn as sns

# --- Step 1: データ読み込み ---
df = pd.read_csv("keystroke_log.csv")

# --- Step 2: 欠損・不要データ除去 ---
df = df.dropna()
df = df[df["label"] != ""]  # ラベル付きデータだけ使う

# --- Step 3: 特徴量とラベルの分離 ---
X = df[["char_count", "interval", "speed", "error_rate"]]
y = df["label"]

# --- Step 4: 学習・テストに分割 ---
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# --- Step 5: モデル構築・学習 ---
model = RandomForestClassifier(n_estimators=100, random_state=42)
model.fit(X_train, y_train)

# --- Step 6: 評価 ---
y_pred = model.predict(X_test)
print("分類レポート:")
print(classification_report(y_test, y_pred))

# --- Step 7: 混同行列の可視化 ---
cm = confusion_matrix(y_test, y_pred, labels=model.classes_)
sns.heatmap(cm, annot=True, fmt='d', cmap='Blues',
            xticklabels=model.classes_,
            yticklabels=model.classes_)
plt.xlabel("Predicted")
plt.ylabel("True")
plt.title("Confusion Matrix")
plt.show()

# --- Step 8: モデル保存（任意） ---
import joblib
joblib.dump(model, "keystroke_model.pkl")
