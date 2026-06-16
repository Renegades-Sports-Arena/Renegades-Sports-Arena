import urllib.request
import json

url = "https://xucrozyigmtkmabvfeba.supabase.co/rest/v1/website_config?id=eq.1"
headers = {
    "apikey": "sb_publishable_UKG7P8c5dbk6gAKpeD3xgA_OAyNA1Ki",
    "Authorization": "Bearer sb_publishable_UKG7P8c5dbk6gAKpeD3xgA_OAyNA1Ki"
}

req = urllib.request.Request(url, headers=headers)
try:
    with urllib.request.urlopen(req) as response:
        data = json.loads(response.read().decode())
        print("Successfully fetched website config data!")
        if data and len(data) > 0:
            config = data[0].get("data", {})
            print("Coaches Section:")
            print(json.dumps(config.get("coaches"), indent=2))
        else:
            print("No config records found.")
except Exception as e:
    print("Error fetching website config:", e)
