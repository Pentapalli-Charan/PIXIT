import re

with open(r'c:\Users\pchar\OneDrive\Desktop\PIXIT project\frontend\components\styling.py', 'r', encoding='utf-8') as f:
    content = f.read()

new_render_header = """def render_header():
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
    background: linear-gradient(90deg, #D9480F, #F76707);
    color: white !important;
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
    box-shadow: 0 4px 12px rgba(217, 72, 15, 0.4);
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
    <div class="logo" style="display:flex; align-items:center; gap:8px;">
        <svg width="28" height="28" viewBox="0 0 105 40" style="vertical-align: middle;">
            <text x="0" y="32" font-family="'Inter', sans-serif" font-weight="900" font-size="34" letter-spacing="-3">
                <tspan fill="var(--neon-green)">PIX</tspan><tspan fill="var(--text-color)">IT</tspan>
            </text>
            <circle cx="86" cy="30" r="5" fill="var(--neon-green)"/>
        </svg>
        <span style="font-weight: 900; font-size: 1.2rem; letter-spacing: -0.5px; color: white;">PIXIT.AI</span>
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
        html_end = '''
        <a href="/Auth" target="_self" class="btn-login-custom">➔ Login</a>
        <a href="#" target="_self" class="btn-try-free-custom">✨ Try Free</a>
    </div>
</div>
        '''
    else:
        username = dict(user).get('username', 'U')
        user_initial = username[0].upper() if username else 'U'
        html_end = f'''
        <a href="/?dashboard_page=Profile" target="_self" class="btn-try-free-custom" style="padding: 8px 16px;">👤 {user_initial} Profile</a>
        <a href="/?logout=1" target="_self" class="btn-login-custom">Logout</a>
    </div>
</div>
        '''

    st.markdown(html_start + html_end, unsafe_allow_html=True)
"""

pattern = re.compile(r'def render_header\(\):.*', re.DOTALL)
if pattern.search(content):
    content = pattern.sub(new_render_header, content)
    with open(r'c:\Users\pchar\OneDrive\Desktop\PIXIT project\frontend\components\styling.py', 'w', encoding='utf-8') as f:
        f.write(content)
    print("Updated styling.py without indentation issues")
else:
    print("render_header not found!")
