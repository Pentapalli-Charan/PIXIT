import os

APP_PY = r"c:\Users\pchar\OneDrive\Desktop\PIXIT project\frontend\app.py"
STYLING_PY = r"c:\Users\pchar\OneDrive\Desktop\PIXIT project\frontend\components\styling.py"

os.makedirs(os.path.dirname(STYLING_PY), exist_ok=True)

with open(APP_PY, 'r', encoding='utf-8') as f:
    lines = f.readlines()

# We need to extract NEON_THEME_CSS (line 46 to 235 roughly) and render_header (293 to 349 roughly)
# But it's better to just search for them
css_start = -1
css_end = -1
header_start = -1
header_end = -1

for i, line in enumerate(lines):
    if line.startswith("NEON_THEME_CSS ="):
        css_start = i
    if css_start != -1 and line.strip() == 'st.markdown(f"<style>{NEON_THEME_CSS}</style>", unsafe_allow_html=True)':
        css_end = i
    if line.startswith("def render_header():"):
        header_start = i
    if header_start != -1 and line.strip() == 'st.markdown(html_start + html_mid + html_end, unsafe_allow_html=True)':
        header_end = i
        break

if css_start != -1 and header_start != -1:
    styling_content = "import streamlit as st\n\n"
    styling_content += "".join(lines[css_start:css_end+1]) + "\n\n"
    styling_content += "".join(lines[header_start:header_end+1]) + "\n"
    
    with open(STYLING_PY, 'w', encoding='utf-8') as f:
        f.write(styling_content)
        
    print(f"Successfully extracted styling.py")
else:
    print("Could not find blocks")
