// src/backend/events.js
// src/backend/events.js
import { getSecret } from "wix-secrets-backend";
import wixData from "wix-data";
import { fetch } from "wix-fetch";

export async function wixCrm_onContactUpdated(event) {
  const contactId = event.metadata.entityId;

  // ==========================================
  // LOOP PREVENTION: Check if we caused this!
  // ==========================================
  // Check if there is an active "lock" for this contact.
  // If yes, it means HubSpot just updated this contact, so we IGNORE this event.
  const lockCheck = await wixData
    .query("SyncLocks")
    .eq("contactId", contactId)
    .find({ suppressAuth: true });

  if (lockCheck.items.length > 0) {
    console.log("Loop prevented: Ignored Wix event triggered by HubSpot sync.");
    // Clear the lock so future manual updates work
    await wixData.remove("SyncLocks", lockCheck.items[0]._id, {
      suppressAuth: true,
    });
    return;
  }

  // ==========================================
  // NORMAL SYNC: Wix to HubSpot
  // ==========================================
  const hubspotToken = await getSecret("HUBSPOT_ACCESS_TOKEN");
  const contactData = event.entity;

  // 1. Map Wix data to HubSpot properties (Simplified for example)
  // In reality, fetch this mapping from your HubspotMappings collection
  const hubspotPayload = {
    properties: {
      email: contactData.primaryInfo?.email,
      firstname: contactData.primaryInfo?.phone,
    },
  };

  // 2. Push to HubSpot Contacts API
  // Note: You would check if the contact exists first or use HubSpot's unique email identifier to upsert
  try {
    await fetch(`https://api.hubapi.com/crm/v3/objects/contacts`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${hubspotToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(hubspotPayload),
    });
    console.log(`Successfully synced Wix Contact ${contactId} to HubSpot.`);
  } catch (error) {
    console.error("HubSpot Sync Failed", error);
  }
}

export async function wixCrm_onFormSubmitted(event) {
  // 1. Extract standard data
  const email = event.contactInfo.emails[0].email;
  const firstName = event.contactInfo.name.first;

  // 2. Extract context & UTMs (Wix provides this in the form context!)
  const pageUrl = event.context.pageUrl;
  // Parse the URL to grab utm_source, utm_campaign, etc.

  // 3. Send payload to HubSpot Contacts API exactly like we did above,
  // but attach the UTMs to the HubSpot custom properties.
}
