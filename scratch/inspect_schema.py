import urllib.request
import json

url = "https://xucrozyigmtkmabvfeba.supabase.co/rest/v1/"
headers = {
    "apikey": "sb_publishable_UKG7P8c5dbk6gAKpeD3xgA_OAyNA1Ki",
    "Authorization": "Bearer sb_publishable_UKG7P8c5dbk6gAKpeD3xgA_OAyNA1Ki"
}

req = urllib.request.Request(url, headers=headers)
try:
    with urllib.request.urlopen(req) as response:
        spec = json.loads(response.read().decode())
        print("Successfully fetched OpenAPI spec!")
        
        definitions = spec.get("definitions", {})
        if "trial_bookings" in definitions:
            print("\nColumns in 'trial_bookings':")
            properties = definitions["trial_bookings"].get("properties", {})
            required = definitions["trial_bookings"].get("required", [])
            for col, details in properties.items():
                req_str = " (REQUIRED)" if col in required else ""
                print(f" - {col}: {details.get('type')} / {details.get('format')}{req_str}")
        else:
            print("\n'trial_bookings' table not found in definitions. Available definitions:")
            print(list(definitions.keys()))
            
except Exception as e:
    print("Error fetching OpenAPI spec:", e)
