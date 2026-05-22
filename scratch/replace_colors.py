import os

FRONTEND_SRC = r"c:\Users\pchar\OneDrive\Desktop\PIXIT project\frontend"

REPLACEMENTS = {
    "#B0FF00": "var(--pixit-primary)",
    "#b0ff00": "var(--pixit-primary)",
    "176, 255, 0": "182, 255, 0",
    "176,255,0": "182,255,0"
}

def process_file(filepath):
    try:
        with open(filepath, "r", encoding="utf-8") as f:
            content = f.read()
        
        modified = False
        new_content = content
        for old, new in REPLACEMENTS.items():
            if old in new_content:
                new_content = new_content.replace(old, new)
                modified = True
        
        if modified:
            with open(filepath, "w", encoding="utf-8") as f:
                f.write(new_content)
            print(f"Updated: {filepath}")
    except Exception as e:
        print(f"Error processing {filepath}: {e}")

def main():
    for root, dirs, files in os.walk(FRONTEND_SRC):
        # Skip node_modules and dist
        if "node_modules" in root or "dist" in root:
            continue
        for file in files:
            if file.endswith((".js", ".jsx", ".css", ".html")):
                process_file(os.path.join(root, file))

if __name__ == "__main__":
    main()
