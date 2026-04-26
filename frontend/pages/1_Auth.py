import streamlit as st
import time
from frontend.api_client import APIClient
from frontend.components.styling import inject_theme, render_header

st.set_page_config(page_title="Auth - PIXIT", page_icon="🔐", layout="wide")

# Inject Theme
inject_theme()
render_header()

st.markdown('<div id="main-app" style="margin-top: 40px; padding: 60px; background: var(--card-bg); border-radius: 40px; border: 1px solid var(--border-color); max-width: 800px; margin-left: auto; margin-right: auto;">', unsafe_allow_html=True)

st.markdown("<h2 style='text-align: center; color: var(--neon-green); margin-bottom: 30px;'>Authentication</h2>", unsafe_allow_html=True)

if st.session_state.get('user'):
    st.success(f"You are already logged in as {st.session_state['user']['username']}!")
    if st.button("Go to Dashboard"):
        st.switch_page("app.py")
else:
    tab1, tab2 = st.tabs(["Login", "Register"])
    
    with tab1:
        st.markdown("### Sign In to PIXIT")
        with st.form("login_form"):
            identifier = st.text_input("Username or Email")
            password = st.text_input("Password", type="password")
            submit_login = st.form_submit_button("Sign In")
            
            if submit_login:
                res = APIClient.auth.login({"identifier": identifier, "password": password})
                if res["success"]:
                    st.session_state['user'] = res["data"]
                    st.success(res["data"].get("message", "Login successful! Redirecting..."))
                    time.sleep(1)
                    st.switch_page("app.py")
                else:
                    st.error(res["error"])
                    
    with tab2:
        st.markdown("### Create an Account")
        with st.form("register_form"):
            reg_username = st.text_input("Choose Username")
            reg_email = st.text_input("Email Address")
            reg_password = st.text_input("Password", type="password")
            submit_reg = st.form_submit_button("Register")
            
            if submit_reg:
                res = APIClient.auth.register({
                    "username": reg_username,
                    "email": reg_email,
                    "password": reg_password
                })
                if res["success"]:
                    st.success("Account created successfully! You can now log in.")
                else:
                    st.error(res["error"])

st.markdown('</div>', unsafe_allow_html=True)
