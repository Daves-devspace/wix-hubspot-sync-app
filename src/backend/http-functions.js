// src/backend/http-functions.js
import { ok, badRequest, serverError } from 'wix-http-functions';
import { contacts } from 'wix-crm-backend';
import wixData from 'wix-data';

// Endpoint URL: https://<your-domain>/_functions/hubspotWebhook
export async function post_hubspotWebhook(request) {
    try {
        const payload = await request.body.json();
        
        // Loop through HubSpot webhook events
        for (const event of payload) {
            // Assume we matched the HubSpot email to a Wix Contact ID 
            // (You'd query your DB or Wix CRM for the matching email here)
            const wixContactId = await findWixContactByEmail(event.properties.email.value);

            if (wixContactId) {
                // ==========================================
                // LOOP PREVENTION: Set the Lock
                // ==========================================
                // Before we update Wix, we insert a lock. 
                // When Wix fires 'onContactUpdated' 1 second from now, it will see this lock and stop.
                await wixData.insert("SyncLocks", {
                    "contactId": wixContactId,
                    "timestamp": new Date(),
                    "source": "hubspot"
                }, { suppressAuth: true });

                // ==========================================
                // UPDATE WIX
                // ==========================================
                const updatedInfo = {
                    name: { first: event.properties.firstname.value }
                };

                await contacts.updateContact(wixContactId, updatedInfo, { suppressAuth: true });
            }
        }

        return ok({ body: "Webhook processed" });

    } catch (error) {
        console.error(error);
        return serverError({ body: "Error processing HubSpot payload" });
    }
}

// Helper function mock
async function findWixContactByEmail(email) {
    // Logic to search wix-crm for contact ID by email
    return "wix_contact_12345"; 
}