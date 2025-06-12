import keyboard
import time
import requests
import threading
import tkinter as tk

last_typing_time = time.time()

def show_popup(message):
    def _show():
        root = tk.Tk()
        root.overrideredirect(False)  # ウィンドウ枠を表示（×ボタン用）
        root.attributes("-topmost", True)
        root.geometry("+{}+{}".format(root.winfo_screenwidth() - 320, root.winfo_screenheight() - 120))

        frame = tk.Frame(root, bg="lightyellow", padx=10, pady=5, relief="solid", borderwidth=1)

        # 閉じるボタン
        def close():
            root.destroy()

        close_btn = tk.Button(frame, text="×", command=close, bd=0, fg="red", bg="lightyellow", font=("Arial", 10, "bold"))
        close_btn.pack(side="top", anchor="ne")

        # メッセージ
        label = tk.Label(frame, text=message, bg="lightyellow", font=("Arial", 11))
        label.pack()

        frame.pack()

        # 3秒後に自動で閉じる
        root.after(3000, close)
        root.mainloop()

    threading.Thread(target=_show).start()

def on_key_event(e):
    global last_typing_time
    now = time.time()
    interval = now - last_typing_time
    last_typing_time = now

    try:
        res = requests.post("http://127.0.0.1:5000/keystroke")
        if res.ok:
            data = res.json()
            if data.get("emotion") == "pause":
                show_popup(data.get("message", ""))
    except Exception as err:
        print("⚠ Flaskサーバーに接続できませんでした:", err)

keyboard.on_press(on_key_event)
print("⌨ 全体キーボード監視＋吹き出し通知（×ボタン付き）を開始します。Ctrl+C で停止できます。")
keyboard.wait()
