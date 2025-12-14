import requests
import json
import uuid
import time
from datetime import datetime, timedelta

BASE_URL = "http://localhost:8080"

def print_header(text):
    print(f"\n{'='*50}\n{text}\n{'='*50}")

def create_user(email=None):
    if not email:
        email = input("Enter email (default: random): ") or f"user-{uuid.uuid4().hex[:8]}@example.com"
    
    res = requests.post(f"{BASE_URL}/users", json={"email": email})
    if res.status_code in [200, 201]:
        user = res.json()
        print(f"User Created: {user['email']} (ID: {user['id']})")
        return user
    else:
        print(f"Failed: {res.text}")
        return None

def create_auction(seller_id):
    title = input("Auction Title (default: Test Auction): ") or "Test Auction"
    start_price = int(input("Start Price (cents, default: 1000): ") or "1000")
    
    # Use UTC to be safe with server time, add buffer
    # Format: 2023-12-01T10:00:00
    now_utc = datetime.utcnow()
    start_time = (now_utc + timedelta(minutes=1)).strftime('%Y-%m-%dT%H:%M:%S')
    end_time = (now_utc + timedelta(hours=1)).strftime('%Y-%m-%dT%H:%M:%S')
    
    payload = {
        "sellerId": seller_id,
        "title": title,
        "description": "Created via CLI",
        "startPrice": start_price,
        "startTime": start_time,
        "endTime": end_time
    }
    
    res = requests.post(f"{BASE_URL}/auctions", json=payload)
    if res.status_code in [200, 201]:
        auction = res.json()
        print(f"Auction Created: {auction['title']} (ID: {auction['id']})")
        return auction
    else:
        print(f"Failed: {res.text}")
        return None

def start_auction(auction_id):
    res = requests.post(f"{BASE_URL}/auctions/{auction_id}/start")
    if res.status_code == 200:
        print("Auction is now LIVE!")
    else:
        print(f"Failed: {res.text}")

def place_bid(auction_id, bidder_id, amount):
    payload = {"bidderId": bidder_id, "amount": amount}
    res = requests.post(f"{BASE_URL}/auctions/{auction_id}/bids", json=payload)
    if res.status_code == 202:
        print(f"Bid Accepted: {amount}")
        return True
    else:
        print(f"Bid Rejected: {res.text}")
        return False

def view_auction(auction_id):
    res = requests.get(f"{BASE_URL}/auctions/{auction_id}")
    if res.status_code == 200:
        data = res.json()
        print(json.dumps(data, indent=2))
        return data
    else:
        print("Fetch failed")
        return None
        
def view_user(user_id):
    res = requests.get(f"{BASE_URL}/users/{user_id}")
    if res.status_code == 200:
        data = res.json()
        print(f"User Balance: Available={data['availableBalance']}, Reserved={data['reservedBalance']}")
    else:
        print("Fetch failed")

def simulate_war():
    print_header("WAR ROOM SIMULATION")
    
    # Setup
    print("1. Creating Seller...")
    suffix = uuid.uuid4().hex[:4]
    seller = create_user(f"seller-{suffix}@war.com")
    
    print("2. Creating 2 Bidders...")
    p1 = create_user(f"bidder1-{suffix}@war.com")
    p2 = create_user(f"bidder2-{suffix}@war.com")
    
    if not seller or not p1 or not p2:
        print("Critical failure creating users. Aborting.")
        return
    
    print("3. Creating Auction...")
    auction = create_auction(seller['id'])
    
    print("4. Starting Auction...")
    start_auction(auction['id'])
    
    # Battle
    current_price = auction['currentPrice']
    bidder_pool = [p1, p2]
    
    print("\nBEGINNING BID WAR")
    for i in range(5):
        bidder = bidder_pool[i % 2]
        increment = 100
        bid_amount = current_price + ((i + 1) * increment)
        
        print(f"\nBid #{i+1} by {bidder['email']} for {bid_amount}...")
        if place_bid(auction['id'], bidder['id'], bid_amount):
            current_price = bid_amount
            # Show balances
            view_user(p1['id'])
            view_user(p2['id'])
        else:
            print("War ended early due to rejection.")
            break
        time.sleep(1)

def main_menu():
    while True:
        print_header("LIVEBID CLI")
        print("1. Create User")
        print("2. Create Auction")
        print("3. Start Auction")
        print("4. Place Bid")
        print("5. View Auction")
        print("6. SIMULATE BID WAR")
        print("0. Exit")
        
        choice = input("\nSelect: ")
        
        if choice == "1":
            create_user()
        elif choice == "2":
            sid = input("Seller ID: ")
            create_auction(sid)
        elif choice == "3":
            aid = input("Auction ID: ")
            start_auction(aid)
        elif choice == "4":
            aid = input("Auction ID: ")
            bidder = input("Bidder ID: ")
            amt = int(input("Amount: "))
            place_bid(aid, bidder, amt)
        elif choice == "5":
            aid = input("Auction ID: ")
            view_auction(aid)
        elif choice == "6":
            simulate_war()
        elif choice == "0":
            break

if __name__ == "__main__":
    main_menu()
