with open("c:\\Users\\KISHANKARTIK G\\Renegades-Sports-Arena\\assets\\css\\style.css", "r", encoding="utf-8") as f:
    lines = f.readlines()

keywords = ["form", "contact", "control", "input", "textarea", "select"]
for i, line in enumerate(lines):
    for kw in keywords:
        if kw in line.lower():
            print(f"Line {i+1}: {line.strip()}")
            break
