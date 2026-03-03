import os
import httpx
from supabase import create_client, Client
from dotenv import load_dotenv

# Load from specific path
load_dotenv(os.path.join(os.getcwd(), "backend", ".env"))

url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_KEY")

print(f"DEBUG: URL={url}")

try:
    # Test simple DNS resolution/connectivity
    r = httpx.get("https://www.google.com")
    print(f"DEBUG: Connectivity to Google: {r.status_code}")
except Exception as e:
    print(f"DEBUG: Connectivity to Google FAILED: {e}")

if not url or not key:
    print(f"Error: SUPABASE_URL or SUPABASE_KEY not found in backend/.env")
    exit(1)

supabase: Client = create_client(url, key)

def check_tables():
    tables = ['profiles', 'documents', 'chat_sessions', 'chat_messages']
    for table in tables:
        try:
            # Try to select a single row to check existence
            supabase.table(table).select("*").limit(1).execute()
            print(f"Table '{table}' exists.")
        except Exception as e:
            err_msg = str(e)
            if "PGRST204" in err_msg or "PGRST205" in err_msg or "404" in err_msg:
                print(f"Table '{table}' NOT found.")
            else:
                print(f"Error checking table '{table}': {err_msg}")

if __name__ == "__main__":
    check_tables()
