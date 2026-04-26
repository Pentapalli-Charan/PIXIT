import os

APP_PY = r"c:\Users\pchar\OneDrive\Desktop\PIXIT project\frontend\app.py"

with open(APP_PY, 'r', encoding='utf-8') as f:
    content = f.read()

# We need to find:
target = """    if 'dashboard_page' not in st.session_state:
        st.session_state['dashboard_page'] = PAGE_IMAGE_STYLIZER

    selected_page = st.session_state['dashboard_page']"""

replacement = """    if 'dashboard_page' not in st.session_state:
        st.session_state['dashboard_page'] = PAGE_IMAGE_STYLIZER

    selected_page = st.session_state['dashboard_page']
    
    # Centralized Session Verification
    if selected_page in ["History", "Profile"] and is_guest:
        st.session_state['dashboard_page'] = PAGE_IMAGE_STYLIZER
        st.warning("You must be logged in to view that page.")
        st.switch_page("pages/1_Auth.py")"""

if target in content:
    content = content.replace(target, replacement)
    with open(APP_PY, 'w', encoding='utf-8') as f:
        f.write(content)
    print("Successfully injected session verification.")
else:
    print("Target string not found in app.py")
