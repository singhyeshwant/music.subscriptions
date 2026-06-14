# Optional backend enhancements (all Free-Tier safe)

You mentioned you can update the backend. None of these are required — the redesigned frontend already works against your current Lambdas. These are optional, ordered by value, and each stays within the AWS Free Tier.

## 1. Security: hash passwords (highest priority)
If the `login`/`register` Lambdas currently store or compare plaintext passwords, switch to a salted hash. In a Python Lambda you can use the standard library (no extra cost, no layer needed for `hashlib`/`hmac`), or bundle `bcrypt` in a layer.

```python
import hashlib, os, hmac
def hash_pw(pw, salt=None):
    salt = salt or os.urandom(16)
    dk = hashlib.pbkdf2_hmac('sha256', pw.encode(), salt, 200_000)
    return salt.hex() + ':' + dk.hex()
def verify_pw(pw, stored):
    salt_hex, _ = stored.split(':')
    return hmac.compare_digest(hash_pw(pw, bytes.fromhex(salt_hex)), stored)
```
Store the combined `salt:hash` string in DynamoDB instead of the raw password.

## 2. Lock down CORS
Set explicit CORS on API Gateway responses instead of `*` once the site is live:
`Access-Control-Allow-Origin: https://YOUR-BUCKET.s3-website-REGION.amazonaws.com`. Free.

## 3. Add a `genre` attribute to the music table
DynamoDB is schemaless, so add `genre` to items and include it in the `/query_lambda_function` response. The frontend can then show genre tags and filter chips with zero extra requests. No cost change.

## 4. A recommendations endpoint
A small Lambda that takes a user's subscribed artists and returns other tracks by those artists (a `Query`/`Scan` on the existing music table). The frontend already groups by artist, so a "More from artists you follow" row drops in cleanly. Stays within free DynamoDB read capacity for this scale.

## 5. Consolidate per-user subscription tables
The current `action: 'create'` flow appears to create a table per user. A single `Subscriptions` table with partition key `email` and sort key `title#artist` is simpler, avoids table-count limits, and is well within the 25 GB / 25 RCU-WCU free allowance. The frontend needs no change — keep the same `fetch/subscribe/remove` contract.

## 6. Throttling
Enable a usage plan / throttle on the API Gateway stage (e.g. 10 req/s, burst 20). Free, and protects the Lambdas from runaway calls.

---
If you'd like, I can write any of these Lambda handlers out in full — just say which.
