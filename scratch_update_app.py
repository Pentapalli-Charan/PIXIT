import re

with open(r'c:\Users\pchar\OneDrive\Desktop\PIXIT project\frontend\app.py', 'r', encoding='utf-8') as f:
    content = f.read()

target = """    if 'dashboard_page' not in st.session_state:
        st.session_state['dashboard_page'] = PAGE_IMAGE_STYLIZER

    selected_page = st.session_state['dashboard_page']"""

replacement = """    if 'logout' in st.query_params:
        st.session_state['user'] = None
        st.query_params.clear()
        st.rerun()

    if 'dashboard_page' in st.query_params:
        st.session_state['dashboard_page'] = st.query_params['dashboard_page']
        st.query_params.clear()
        st.rerun()

    if 'dashboard_page' not in st.session_state:
        st.session_state['dashboard_page'] = PAGE_IMAGE_STYLIZER

    selected_page = st.session_state['dashboard_page']"""

if target in content:
    content = content.replace(target, replacement)
    with open(r'c:\Users\pchar\OneDrive\Desktop\PIXIT project\frontend\app.py', 'w', encoding='utf-8') as f:
        f.write(content)
    print("Updated app.py")
else:
    print("Target not found in app.py")
