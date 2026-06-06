# Wix ↔ HubSpot Bi-Directional Integration

A custom Wix App built to seamlessly and securely sync contacts and form submissions between a Wix site and HubSpot CRM.

## Deliverable A: API Plan & Architecture

### 1. Integrations Used
* **Wix CRM API (`wix-crm.v2`) & Wix Events:** Utilized to listen for `onContactCreated` and `onContactUpdated` to push data out, and to programmatically update Wix contacts when inbound webhooks arrive.
* **HubSpot CRM Contacts API (`/crm/v3/objects/contacts`):** Used for creating and updating contacts based on the user-defined field mapping.
* **HubSpot Webhooks API:** Subscribed to `contact.creation` and `contact.propertyChange` to trigger updates back to Wix via the `http-functions.js` endpoint.
* **HubSpot OAuth 2.0:** For secure, token-based authentication (no API keys exposed).

### 2. Architectural Decisions & Loop Prevention
The biggest challenge in bi-directional syncing is the infinite loop (ping-pong effect). I solved this using a **Stateful Lock mechanism**:
* When HubSpot sends a webhook to update a Wix contact, the backend first writes a temporary "lock" to a `SyncLocks` database collection containing the `contactId`.
* It then updates the Wix contact. This naturally triggers the Wix `onContactUpdated` event.
* However, the Wix event listener first checks the `SyncLocks` table. Finding the lock, it recognizes the update originated from HubSpot, ignores the event, and deletes the lock. **Loop prevented.**

### 3. Security
* All OAuth tokens are vaulted securely using Wix Secrets Manager.
* The React frontend is entirely stateless regarding authentication; all API calls to HubSpot are routed securely through the Wix backend.