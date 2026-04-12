import firebase_admin
from firebase_admin import credentials, firestore
import time
import os

# Initialize Firebase Admin
# We expect the service account JSON path to be provided via environment variable
cred_path = os.getenv('FIREBASE_SERVICE_ACCOUNT')
if cred_path:
    cred = credentials.Certificate(cred_path)
    firebase_admin.initialize_app(cred)
else:
    # Fallback to default credentials (if running on a GCP environment)
    # or assume it's already initialized by environment
    firebase_admin.initialize_app()

db = firestore.client()

RETENTION_HOURS = int(os.getenv('RETENTION_HOURS', '48'))

def clean_old_posts():
    print(f"Starting cleanup: deleting posts older than {RETENTION_HOURS} hours...")
    
    threshold = time.time() - (RETENTION_HOURS * 3600)
    
    # Query posts where created_at < threshold
    # Note: created_at in Firestore is a Timestamp object
    posts_ref = db.collection('posts')
    query = posts_ref.where('created_at', '<', firestore.Timestamp.from_seconds(int(threshold)))
    
    docs = query.stream()
    count = 0
    for doc in docs:
        doc.reference.delete()
        count += 1
        
    print(f"Cleanup finished. Deleted {count} posts.")

if __name__ == "__main__":
    while True:
        try:
            clean_old_posts()
        except Exception as e:
            print(f"Error during cleanup: {e}")
        
        # Run every hour
        print("Sleeping for 1 hour...")
        time.sleep(3600)
