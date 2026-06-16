import urllib.request
import json

url = "https://xucrozyigmtkmabvfeba.supabase.co/rest/v1/trial_bookings"
headers = {
    "apikey": "sb_publishable_UKG7P8c5dbk6gAKpeD3xgA_OAyNA1Ki",
    "Authorization": "Bearer sb_publishable_UKG7P8c5dbk6gAKpeD3xgA_OAyNA1Ki",
    "Content-Type": "application/json",
    "Prefer": "return=representation"
}

payload = {
    "name": "Test Athlete",
    "age": 15,
    "phone": "9999999999",
    "email": "test@test.com",
    "skill_level": "Intermediate",
    "booking_date": "2026-06-20",
    "booking_slot": "6 AM"
}

req = urllib.request.Request(url, data=json.dumps(payload).encode(), headers=headers, method="POST")
try:
    with urllib.request.urlopen(req) as response:
        print("Empty insert successful!")
        data = json.loads(response.read().decode())
        print("Returned columns:", list(data[0].keys()) if data else "No data returned")
        print("Full row:", data)
except Exception as e:
    print("Error inserting:")
    if hasattr(e, 'read'):
        print(e.read().decode())
    else:
        print(e)
