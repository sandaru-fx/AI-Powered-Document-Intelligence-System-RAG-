import os
from supabase import create_client
from dotenv import load_dotenv

load_dotenv("backend/.env")

url = os.getenv("SUPABASE_URL")
key = os.getenv("SUPABASE_KEY")

supabase = create_client(url, key)

email = "demo.user@gmail.com"
password = "Demo123456!"

try:
    res = supabase.auth.sign_up({
        "email": email,
        "password": password,
    })
    print(f"✅ Success! Demo user created.")
    print(f"Email: {email}")
    print(f"Password: {password}")
    print("\nNote: If 'Confirm Email' is enabled in Supabase, you might still need to check your email or manually confirm the user in the dashboard.")
except Exception as e:
    print(f"❌ Error: {e}")
