
import streamlit as st
import os
import uuid
import datetime
from PIL import Image

def get_unique_filename(filename):
    """Generates a unique filename using UUID and timestamp."""
    ext = os.path.splitext(filename)[1]
    # Keep filename very short to prevent Windows MAX_PATH (260 char) limit errors
    unique_name = f"img_{uuid.uuid4().hex[:6]}_{int(datetime.datetime.now().timestamp() % 100000)}{ext}"
    return unique_name

def save_uploaded_file(uploaded_file):
    """Saves the uploaded file to the 'uploads' directory."""
    try:
        # Create uploads directory if it doesn't exist
        base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
        if os.name == 'nt' and not base_dir.startswith('\\\\?\\'):
            base_dir = '\\\\?\\' + base_dir
        
        upload_dir = os.path.join(base_dir, "uploads")
        if not os.path.exists(upload_dir):
            os.makedirs(upload_dir)
        
        # Generate unique filename
        unique_filename = get_unique_filename(uploaded_file.name)
        file_path = os.path.join(upload_dir, unique_filename)
        
        # Save the file
        with open(file_path, "wb") as f:
            f.write(uploaded_file.getbuffer())
            
        return file_path
    except Exception as e:
        st.error(f"Error saving file: {e}")
        return None

def validate_image(uploaded_file):
    """Validates the uploaded image file."""
    # Check file size (limit to 10MB)
    MAX_FILE_SIZE = 10 * 1024 * 1024 # 10MB
    if uploaded_file.size > MAX_FILE_SIZE:
        return False, "File size exceeds the 10MB limit."
    
    # Check file type (Streamlit's file_uploader already handles extension filtering, 
    # but we can add extra validation if needed)
    valid_types = ["image/jpeg", "image/png", "image/bmp", "image/jpg"]
    if uploaded_file.type not in valid_types:
        return False, "Unsupported file format. Please upload JPG, JPEG, PNG, or BMP."
        
    return True, "Valid image."

def display_image_metadata(image, uploaded_file):
    """Extracts and displays image metadata."""
    col1, col2, col3 = st.columns(3)
    with col1:
        st.metric("Dimensions", f"{image.width} x {image.height} px")
    with col2:
        file_size_mb = uploaded_file.size / (1024 * 1024)
        st.metric("File Size", f"{file_size_mb:.2f} MB")
    with col3:
        st.metric("Format", image.format)

def render_upload_section():
    """Renders the image upload section in the Streamlit app."""
    
    with st.container():
        
        uploaded_file = st.file_uploader(
            "Choose an image...", 
            type=['jpg', 'jpeg', 'png', 'bmp'],
            help="Limit 10MB per file • JPG, JPEG, PNG, BMP",
            label_visibility="collapsed"
        )

        if uploaded_file is not None:
            is_valid, message = validate_image(uploaded_file)
            
            if is_valid:
                try:
                    image = Image.open(uploaded_file)
                    
                    st.markdown("<div style='margin-bottom: 2rem'></div>", unsafe_allow_html=True)
                    
                    # Display uploaded image with a card-like container
                    col_img, col_info = st.columns([1, 1])
                    with col_img:
                        st.image(image, caption="Current Upload", use_container_width=True)
                    
                    with col_info:
                        st.markdown("#### Image Details")
                        display_image_metadata(image, uploaded_file)
                        
                        # Save file
                        file_path = save_uploaded_file(uploaded_file)
                        if file_path:
                            st.session_state['uploaded_image_path'] = file_path
                            st.success(f"Successfully uploaded")
                    
                except Exception as e:
                    st.error(f"Error processing image: {e}")
            else:
                st.error(message)
        else:
            # Clear session state if user removes the file
            if 'uploaded_image_path' in st.session_state:
                # We initiate a clean state
                pass
