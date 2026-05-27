import os
import urllib.request
import zipfile
import io

tools_dir = r"c:\Users\pchar\OneDrive\Desktop\PIXIT project\devops_tools"
os.makedirs(tools_dir, exist_ok=True)

# 1. Download and Extract Terraform
terraform_url = "https://releases.hashicorp.com/terraform/1.8.4/terraform_1.8.4_windows_amd64.zip"
zip_path = os.path.join(tools_dir, "terraform.zip")

print("Downloading Terraform...")
try:
    urllib.request.urlretrieve(terraform_url, zip_path)
    print("Extracting Terraform...")
    with zipfile.ZipFile(zip_path, 'r') as zip_ref:
        zip_ref.extractall(tools_dir)
    os.remove(zip_path)
    print("Terraform download and extraction complete.")
except Exception as e:
    print(f"Error downloading/extracting Terraform: {e}")

# 2. Download Kind (Kubernetes in Docker)
kind_url = "https://github.com/kubernetes-sigs/kind/releases/download/v0.23.0/kind-windows-amd64"
kind_path = os.path.join(tools_dir, "kind.exe")

print("Downloading Kind...")
try:
    urllib.request.urlretrieve(kind_url, kind_path)
    print("Kind download complete.")
except Exception as e:
    print(f"Error downloading Kind: {e}")

print("Verification:")
print(f"Files in devops_tools: {os.listdir(tools_dir)}")
