file_path = r"c:\DEV\PFA\Model\Models\student_performance_model.pkl"

try:
    with open(file_path, 'rb') as f:
        header = f.read(100)
        print(f"Header bytes: {header}")
        try:
            print(f"Header text: {header.decode('utf-8')}")
        except:
            print("Header is binary")
except Exception as e:
    print(f"Error reading file: {e}")
