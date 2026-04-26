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
    st.markdown('''
<div style="background: #111; color: white; text-align: center; padding: 10px; font-size: 0.85rem; display: flex; justify-content: center; align-items: center; gap: 15px; border-bottom: 1px solid #222;">
    <span style="background: rgba(255,255,255,0.1); padding: 3px 8px; border-radius: 12px; font-size: 0.7rem; font-weight: bold; display: flex; align-items: center; gap: 5px;"><span style="color:#ff4444;">🚀</span> NEW</span>
    Introducing 9 AI Art Styles + Batch Processing + AR Camera — all free to try!
    <a href="#" style="color: white; text-decoration: none; font-weight: 700; background: rgba(255,255,255,0.1); padding: 4px 12px; border-radius: 50px; font-size: 0.75rem;">Try Now ➔</a>
</div>
    ''', unsafe_allow_html=True)

    html_start = f'''
<style>
/* Reset default header behavior */
[data-testid="stHeader"] {{ display: none !important; }}

.header-pill {{
    display: flex;
    align-items: center;
    justify-content: space-between;
    background-color: #1A1A1A;
    border-radius: 12px;
    padding: 12px 24px;
    margin: 20px auto 40px auto;
    max-width: 1100px;
    border: 1px solid #333;
}}
.header-nav {{
    display: flex;
    gap: 30px;
    align-items: center;
}}
.header-nav a {{
    color: #A0A0A0 !important;
    text-decoration: none !important;
    font-size: 0.85rem;
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 6px;
    transition: color 0.2s;
}}
.header-nav a:hover {{
    color: #FFFFFF !important;
}}
.header-nav a span {{
    font-size: 1rem;
}}
.header-actions {{
    display: flex;
    gap: 15px;
    align-items: center;
}}
.btn-login-custom {{
    background: var(--neon-green);
    color: black !important;
    text-decoration: none !important;
    padding: 8px 20px;
    border-radius: 8px;
    font-weight: 700;
    font-size: 0.9rem;
    display: flex;
    align-items: center;
    gap: 6px;
    transition: transform 0.2s, box-shadow 0.2s;
    border: none;
}}
.btn-login-custom:hover {{
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(176, 255, 0, 0.4);
}}
.btn-try-free-custom {{
    background: #1A1A1A;
    color: white !important;
    text-decoration: none !important;
    padding: 8px 20px;
    border-radius: 8px;
    font-weight: 700;
    font-size: 0.9rem;
    display: flex;
    align-items: center;
    gap: 6px;
    border: 1px solid #444;
    transition: border-color 0.2s, background 0.2s;
}}
.btn-try-free-custom:hover {{
    border-color: #666;
    background: #222;
}}
</style>

<div class="header-pill">
    <div class="logo" style="display:flex; align-items:center;">
        <svg width="105" height="40" viewBox="0 0 105 40" style="vertical-align: middle;">
            <text x="0" y="32" font-family="'Inter', sans-serif" font-weight="900" font-size="34" letter-spacing="-3">
                <tspan fill="var(--neon-green)">PIX</tspan><tspan fill="white">IT</tspan>
            </text>
            <circle cx="82" cy="32" r="5" fill="var(--neon-green)"/>
        </svg>
    </div>
    <div class="header-nav">
        <a href="/?dashboard_page=Stylize" target="_self"><span>🚀</span> Home</a>
        <a href="#" target="_self"><span>🪄</span> Neural Editor</a>
        <a href="#" target="_self"><span>🎨</span> Gallery</a>
        <a href="#" target="_self"><span>📚</span> AI Styles</a>
        <a href="#" target="_self"><span>📖</span> Docs</a>
    </div>
    <div class="header-actions">
    '''

    if is_guest:
        html_end = '''<a href="/Auth" target="_self" class="btn-login-custom">➔ Login</a><a href="#" target="_self" class="btn-try-free-custom">✨ Try Free</a></div></div>'''
    else:
        username = dict(user).get('username', 'U')
        user_initial = username[0].upper() if username else 'U'
        html_end = f'''<a href="/?dashboard_page=Profile" target="_self" class="btn-try-free-custom" style="padding: 8px 16px;">👤 {user_initial} Profile</a><a href="/?logout=1" target="_self" class="btn-login-custom">Logout</a></div></div>'''

    st.markdown(html_start + html_end, unsafe_allow_html=True)
