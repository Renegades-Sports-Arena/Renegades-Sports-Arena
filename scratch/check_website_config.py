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
        print("Success! Data in 'website_config':")
        print(json.dumps(data, indent=2))
except Exception as e:
    print("Error querying website_config:")
    if hasattr(e, 'read'):
        print(e.read().decode())
    else:
        print(e)
