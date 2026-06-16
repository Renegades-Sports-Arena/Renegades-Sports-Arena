import urllib.request
import json

tables = [
    "trial_bookings",
    "mlb_programs",
    "tournaments",
    "teams",
    "players",
    "fixtures",
    "results",
    "registrations"
]

headers = {
    "apikey": "sb_publishable_UKG7P8c5dbk6gAKpeD3xgA_OAyNA1Ki",
    "Authorization": "Bearer sb_publishable_UKG7P8c5dbk6gAKpeD3xgA_OAyNA1Ki"
}

print("Checking table row counts in Supabase:")
for table in tables:
    url = f"https://xucrozyigmtkmabvfeba.supabase.co/rest/v1/{table}?select=count"
    headers["Prefer"] = "count=exact"
    req = urllib.request.Request(url, headers=headers)
    try:
        with urllib.request.urlopen(req) as response:
            count_header = response.headers.get("Content-Range")
            # format: 0-0/5 or similar
            count = count_header.split("/")[-1] if count_header else "Unknown"
            print(f" - {table}: {count} rows")
    except Exception as e:
        print(f" - {table}: Error checking row count: {e}")
