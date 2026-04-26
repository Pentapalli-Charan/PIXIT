import streamlit as st

def inject_theme():
    theme = st.session_state.get('theme', 'dark')
    bg_color = "#000000" if theme == 'dark' else "#F5F5F5"
    text_color = "#FFFFFF" if theme == 'dark' else "#111111"
    card_bg = "#0B0B0B" if theme == 'dark' else "#FFFFFF"
    border_color = "#1F1F1F" if theme == 'dark' else "#E0E0E0"
    nav_color = "#888888" if theme == 'dark' else "#555555"

    NEON_THEME_CSS = f"""
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;900&display=swap');
        
        :root {{
            --neon-green: #B0FF00;
            --bg-color: {bg_color};
            --text-color: {text_color};
            --card-bg: {card_bg};
            --border-color: {border_color};
            --nav-color: {nav_color};
            --glass-bg: rgba(255, 255, 255, 0.03);
        }}

        * {{ font-family: 'Inter', sans-serif; }}

        .stApp {{
            background-color: var(--bg-color) !important;
            color: var(--text-color) !important;
        }}

        /* Grid Background */
        .stAppViewMain::before {{
            content: "";
            position: fixed;
            top: 0; left: 0; width: 100%; height: 100%;
            background-image: 
                linear-gradient(rgba(176, 255, 0, 0.05) 1px, transparent 1px),
                linear-gradient(90deg, rgba(176, 255, 0, 0.05) 1px, transparent 1px);
            background-size: 50px 50px;
            z-index: -1;
        }}

        [data-testid="stHeader"], .stApp > header {{ display: none !important; }}
        
        [data-testid="stAppViewBlockContainer"] {{
            max-width: 1200px !important;
            padding-top: 2rem !important;
            margin-top: 0 !important;
        }}

        /* Native Streamlit Header container override */
        div[data-testid="stHorizontalBlock"] {{
            align-items: center !important;
        }}

        /* Custom Header Wrapper */
        .neon-header-wrapper {{
            position: sticky; top: 0; z-index: 999;
            background: { 'rgba(0,0,0,0.8)' if theme == 'dark' else 'rgba(255,255,255,0.8)' }; 
            backdrop-filter: blur(10px);
            border-bottom: 1px solid var(--border-color);
            padding: 10px 40px;
            margin-bottom: 40px;
            border-radius: 12px;
        }}

        .logo {{ font-weight: 900; font-size: 2rem; text-transform: uppercase; letter-spacing: -1px; color: var(--text-color) !important; }}
        .logo span {{ color: var(--neon-green); }}

        /* Button Overrides for Nav Links */
        button[data-testid="baseButton-secondary"] {{
            background: transparent !important;
            border: none !important;
            color: var(--nav-color) !important;
            font-weight: 600 !important;
            font-size: 0.9rem !important;
            text-transform: none !important;
        }}
        button[data-testid="baseButton-secondary"]:hover {{
            color: var(--text-color) !important;
            transform: scale(1.05);
        }}

        .stButton > button[kind="primary"] {{
            background: var(--neon-green) !important;
            color: black !important;
            border: none !important;
            border-radius: 50px !important;
            font-weight: 600 !important;
            text-transform: uppercase !important;
            padding: 8px 24px !important;
        }}
        .stButton > button[kind="primary"]:hover {{
            box-shadow: 0 0 15px var(--neon-green) !important;
            transform: scale(1.05);
        }}

        /* Forms & Inputs */
        .stTextInput input {{
            background: var(--card-bg) !important; border: 1px solid var(--border-color) !important;
            border-radius: 12px !important; color: var(--text-color) !important;
            padding: 15px !important;
        }}
        .stTextInput input:focus {{ border-color: var(--neon-green) !important; box-shadow: none !important; }}
        
        /* Hide standard decorations */
        [data-testid="stDecoration"] {{ display: none !important; }}
        .block-container {{ padding-top: 1rem !important; }}
    """
    st.markdown(f"<style>{NEON_THEME_CSS}</style>", unsafe_allow_html=True)


def render_header():
    user = st.session_state.get('user', None)
    is_guest = user is None
    theme = st.session_state.get('theme', 'dark')

    # Top banner announcement
    st.markdown(f"""
    <div style="background: #111; color: white; text-align: center; padding: 10px; font-size: 0.85rem; display: flex; justify-content: center; align-items: center; gap: 15px; border-bottom: 1px solid #222;">
        <span style="background: rgba(255,255,255,0.1); padding: 3px 8px; border-radius: 12px; font-size: 0.7rem; font-weight: bold; display: flex; align-items: center; gap: 5px;"><span style="color:var(--neon-green);">🚀</span> NEW</span>
        Introducing 9 AI Art Styles + Batch Processing + AR Camera — all free to try!
    </div>
    """, unsafe_allow_html=True)

    # Native Streamlit layout wrapped in our CSS class wrapper
    st.markdown('<div class="neon-header-wrapper">', unsafe_allow_html=True)
    
    col1, col2, col3, col4 = st.columns([1.5, 5, 0.5, 2.5])
    
    with col1:
        st.markdown("""
        <div class="logo" style="margin-top: 5px;">
            <span style="color:var(--neon-green);">PIX</span><span style="color:var(--text-color);">IT</span>
        </div>
        """, unsafe_allow_html=True)
        
    with col2:
        c1, c2, c3, c4 = st.columns(4)
        with c1:
            if st.button("🏠 Home", key="nav_home"):
                st.session_state['dashboard_page'] = "Stylize"
                st.switch_page("app.py")
        with c2:
            if st.button("🪄 Neural Editor", key="nav_editor"):
                pass # Will implement later
        with c3:
            if st.button("🎨 Gallery", key="nav_gallery"):
                pass
        with c4:
            if not is_guest:
                if st.button("🛒 My Purchases", key="nav_purchases"):
                    st.session_state['dashboard_page'] = "History"
                    st.switch_page("app.py")
            else:
                if st.button("📚 Docs", key="nav_docs"):
                    pass
                
    with col3:
        theme_icon = '💡' if theme == 'dark' else '⚫'
        if st.button(theme_icon, key="nav_theme"):
            st.session_state['theme'] = 'light' if theme == 'dark' else 'dark'
            st.rerun()
            
    with col4:
        c1, c2 = st.columns(2)
        if is_guest:
            with c1:
                if st.button("➔ Login", type="primary", key="nav_login"):
                    st.switch_page("pages/1_Auth.py")
            with c2:
                if st.button("✨ Try Free", key="nav_tryfree"):
                    pass
        else:
            username = dict(user).get('username', 'U')
            user_initial = username[0].upper() if username else 'U'
            with c1:
                if st.button(f"👤 {user_initial} Profile", key="nav_profile"):
                    st.session_state['dashboard_page'] = "Profile"
                    st.switch_page("app.py")
            with c2:
                if st.button("Logout", type="primary", key="nav_logout"):
                    st.session_state['user'] = None
                    st.rerun()

    st.markdown('</div>', unsafe_allow_html=True)
