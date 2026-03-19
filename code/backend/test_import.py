import traceback
try:
    import app.main
    print("SUCCESS")
except Exception as e:
    with open('crash.txt', 'w', encoding='utf-8') as f:
        traceback.print_exc(file=f)
    print("FAILED")
