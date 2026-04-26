import re

with open(r'c:\Users\pchar\OneDrive\Desktop\PIXIT project\frontend\app.py', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Replace the top part to import the styling components and inject the theme
top_target = """import time
from backend import database
from frontend import upload_module
from backend import image_processing


# --- Page Config ---
# --- Page Config ---
st.set_page_config(page_title="PIXIT PRO AI Stylizer", page_icon="🎨", layout="wide")

# Initialize Theme State
if 'theme' not in st.session_state:
    st.session_state['theme'] = 'dark'"""

top_replacement = """import time
from backend import database
from frontend import upload_module
from backend import image_processing
from frontend.components.styling import inject_theme, render_header

# --- Page Config ---
st.set_page_config(page_title="PIXIT PRO AI Stylizer", page_icon="🎨", layout="wide")

# Initialize Theme State
if 'theme' not in st.session_state:
    st.session_state['theme'] = 'dark'

inject_theme()
"""
if top_target in content:
    content = content.replace(top_target, top_replacement)
else:
    print("Failed to find top_target")

# 2. Remove the toggle_theme, CSS and old render_header() by just not calling them, but actually we should remove them to avoid clutter.
# A regex to remove from `def toggle_theme():` to `st.markdown(f"<style>{NEON_THEME_CSS}</style>", unsafe_allow_html=True)`
css_pattern = re.compile(r'def toggle_theme\(\):.*?st\.markdown\(f"<style>\{NEON_THEME_CSS\}</style>", unsafe_allow_html=True\)', re.DOTALL)
content = css_pattern.sub('', content)

# A regex to remove `def render_header():` and its body
header_pattern = re.compile(r'# --- Reusable UI Components ---\ndef render_header\(\):.*?st\.markdown\(html_start \+ html_mid \+ html_end, unsafe_allow_html=True\)', re.DOTALL)
content = header_pattern.sub('# --- Reusable UI Components ---', content)

# 3. Call render_header() in main_dashboard()
dashboard_target = """def main_dashboard():
    # Force state stability
    user = st.session_state.get('user', None)"""

dashboard_replacement = """def main_dashboard():
    render_header()
    # Force state stability
    user = st.session_state.get('user', None)"""

if dashboard_target in content:
    content = content.replace(dashboard_target, dashboard_replacement)
else:
    print("Failed to find dashboard_target")

with open(r'c:\Users\pchar\OneDrive\Desktop\PIXIT project\frontend\app.py', 'w', encoding='utf-8') as f:
    f.write(content)

print("App.py cleaned and updated!")
