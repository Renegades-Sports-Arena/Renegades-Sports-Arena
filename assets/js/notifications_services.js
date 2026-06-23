/* ==========================================================================
   RENEGADES SPORTS ARENA - NOTIFICATION SERVICES ARCHITECTURE
   Unified browser push, mock WhatsApp/Email APIs, DB persistence, and Real-time Subscriptions.
   ========================================================================== */

class WhatsAppNotificationService {
  /**
   * Dispatch WhatsApp notification.
   * Scalable architecture wrapping third-party APIs (e.g. Twilio, Meta Cloud API, Interakt).
   */
  static async send(phone, templateName, variables) {
    console.log(`[WhatsApp Service] Dispatched message (template: "${templateName}") to phone: ${phone}`, variables);

    // Simulate network latency
    await new Promise(resolve => setTimeout(resolve, 300));

    const messageText = this.formatTemplate(templateName, variables);
    const provider = (window.env && window.env.WHATSAPP_PROVIDER) || 'twilio';

    console.log(`[WhatsApp Service] Selected Provider: ${provider.toUpperCase()}`);

    let payload = {};
    let endpoint = "";
    
    // Construct request payloads depending on the selected provider
    if (provider === 'twilio') {
      endpoint = "https://api.twilio.com/2010-04-01/Accounts/ACmock/Messages.json";
      payload = {
        To: `whatsapp:${phone}`,
        From: "whatsapp:+14155238886",
        Body: messageText
      };
    } else if (provider === 'meta') {
      endpoint = "https://graph.facebook.com/v17.0/1065403522mock/messages";
      payload = {
        messaging_product: "whatsapp",
        to: phone,
        type: "template",
        template: {
          name: templateName,
          language: { code: "en_US" },
          components: [
            {
              type: "body",
              parameters: Object.keys(variables).map(key => ({
                type: "text",
                text: String(variables[key])
              }))
            }
          ]
        }
      };
    } else if (provider === 'interakt') {
      endpoint = "https://api.interakt.ai/v1/public/message/";
      payload = {
        fullPhoneNumber: phone,
        type: "Template",
        template: {
          name: templateName,
          languageCode: "en",
          bodyValues: Object.keys(variables).map(key => String(variables[key]))
        }
      };
    }

    console.log(`[WhatsApp Service] Mock Payload for ${provider.toUpperCase()}:`, JSON.stringify(payload, null, 2));

    if (window.showToast) {
      window.showToast(`[WhatsApp: ${provider.toUpperCase()}] Dispatch to ${phone}`, "success");
    }

    // Persist log in whatsapp_message_logs if connected
    if (window.supabaseClient && !window.isMockSession) {
      try {
        await window.supabaseClient.from("whatsapp_message_logs").insert([{
          phone_number: phone,
          template_name: templateName,
          message_text: messageText,
          status: "sent",
          provider_used: provider,
          api_response_payload: { provider, payload }
        }]);
      } catch (err) {
        console.error("Failed to insert WhatsApp message log in DB:", err);
      }
    }

    return {
      success: true,
      messageId: `wa-msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      recipient: phone,
      text: messageText,
      provider: provider,
      timestamp: new Date().toISOString()
    };
  }

  static formatTemplate(templateName, variables) {
    const templates = {
      trial_confirmation: "Hello {name}, your trial session at Renegades Sports Arena is confirmed for {date} at {slot}.",
      fee_reminder: "Dear Parent, the training fee of INR {amount} for {student_name} is outstanding. Due: {due_date}.",
      booking_alert: "New trial booking from {name} on {date} at {slot}.",
      payment_confirmation: "Hello {name}, we received your payment of INR {amount} for Invoice {invoice}.",
      shop_order: "Hello {name}, your Renegades Pro Shop order {orderId} for {productName} of amount ₹{amount} has been successfully placed! We will message you when it is ready.",
      tournament_registration: "Hello {name}, your tournament registration for {tournamentName} is confirmed! Pass code: {passCode}.",
      ground_booking: "Hello {name}, your turf slot booking on {date} at {slot} is confirmed.",
      academy_registration: "Hello {name}, welcome to Renegades Academy! Your registration is complete.",
      coupon_confirmation: "Hello {name}, you have been granted coupon {couponCode} for {discountPercent}% off.",
      admin_alert: "Admin Alert: {message}"
    };
    let format = templates[templateName] || "Notification from Renegades Sports Arena: {message}";
    for (const key in variables) {
      format = format.replace(new RegExp(`{${key}}`, "g"), variables[key]);
    }
    return format;
  }
}

class EmailNotificationService {
  /**
   * Dispatch Email notification.
   * Scalable integration wrapping SMTP/API providers (e.g. SendGrid, SES).
   */
  static async send(email, subject, templateName, variables) {
    console.log(`[Email Service] Dispatched email ("${subject}") to email: ${email}`, variables);

    // Simulate network latency
    await new Promise(resolve => setTimeout(resolve, 300));

    const emailBody = this.formatTemplate(templateName, variables);

    // Integrate with FormSubmit.co for admin digests if configured
    if (templateName === 'trial_booking_admin' && variables.adminEmail) {
      try {
        await fetch(`https://formsubmit.co/ajax/${variables.adminEmail}`, {
          method: "POST",
          headers: { "Content-Type": "application/json", "Accept": "application/json" },
          body: JSON.stringify({
            ...variables,
            _subject: subject,
            _captcha: "false"
          })
        });
      } catch (e) {
        console.error("[Email Service] FormSubmit post failed: ", e);
      }
    }

    if (window.showToast) {
      window.showToast(`[Email Service] Dispatched: "${subject}" to ${email}`, "success");
    }

    return {
      success: true,
      messageId: `em-msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      recipient: email,
      text: emailBody,
      timestamp: new Date().toISOString()
    };
  }

  static formatTemplate(templateName, variables) {
    const templates = {
      trial_confirmation: "Dear {name},\n\nYour free trial session is confirmed for {date} at {slot}.\n\nBest regards,\nRenegades Sports Arena",
      fee_reminder: "Dear Parent,\n\nThis is a reminder that the invoice {invoice} for {student_name} is outstanding. Amount: INR {amount}.\n\nBest regards,\nRenegades Sports Arena",
      payment_confirmation: "Dear {name},\n\nWe have successfully received your payment of INR {amount} for invoice {invoice}. Thank you for your payment.\n\nBest regards,\nRenegades Sports Arena"
    };
    let format = templates[templateName] || "Hello, this is an update regarding your activities at Renegades Sports Arena.";
    for (const key in variables) {
      format = format.replace(new RegExp(`{${key}}`, "g"), variables[key]);
    }
    return format;
  }
}

class PushNotificationService {
  /**
   * Browser HTML5 Push Notification permissions and dispatch.
   */
  static async requestPermission() {
    if (!("Notification" in window)) {
      console.warn("This browser does not support browser push notifications");
      return false;
    }
    if (Notification.permission === "granted") {
      return true;
    }
    if (Notification.permission !== "denied") {
      const permission = await Notification.requestPermission();
      return permission === "granted";
    }
    return false;
  }

  static async send(title, body) {
    if (!("Notification" in window)) return false;
    if (Notification.permission === "granted") {
      new Notification(title, {
        body: body,
        icon: "assets/images/logo.png"
      });
      return true;
    }
    return false;
  }
}

class NotificationDispatcher {
  /**
   * Unified interface to log alerts and coordinate multiple channels.
   */
  static async dispatch(payload) {
    const { userId, type, title, message, channels, profileDetails, bookingDetails } = payload;
    const persisted = [];

    // 1. Database persistence
    for (const channel of channels) {
      const record = {
        user_id: userId || null,
        type: type,
        title: title,
        message: message,
        status: "unread",
        channel: channel,
        created_at: new Date().toISOString()
      };

      if (window.isMockSession || !window.supabaseClient) {
        // Mock Session
        const db = JSON.parse(localStorage.getItem("rsa_db")) || { notifications: [] };
        record.id = `not-${Date.now()}-${channel}`;
        db.notifications.push(record);
        localStorage.setItem("rsa_db", JSON.stringify(db));
        persisted.push(record);
      } else {
        // Supabase Live Session
        try {
          const { data, error } = await window.supabaseClient
            .from("notifications")
            .insert([record])
            .select();
          if (error) throw error;
          if (data && data.length > 0) {
            persisted.push(data[0]);
            if (window.liveCache) {
              window.liveCache.notifications = (window.liveCache.notifications || []).concat(data);
            }
          }
        } catch (err) {
          console.error("[Notification Dispatcher] Database save failed:", err);
        }
      }
    }

    // 2. Dispatch services
    const promises = [];
    if (channels.includes("whatsapp") && profileDetails?.phone) {
      promises.push(WhatsAppNotificationService.send(
        profileDetails.phone,
        type,
        {
          name: profileDetails.name || "Renegade",
          date: bookingDetails?.date || "",
          slot: bookingDetails?.slot || "",
          amount: bookingDetails?.amount || "",
          student_name: profileDetails.name || "",
          invoice: bookingDetails?.invoice || ""
        }
      ));
    }
    if (channels.includes("email") && profileDetails?.email) {
      promises.push(EmailNotificationService.send(
        profileDetails.email,
        title,
        type,
        {
          name: profileDetails.name || "Renegade",
          date: bookingDetails?.date || "",
          slot: bookingDetails?.slot || "",
          amount: bookingDetails?.amount || "",
          student_name: profileDetails.name || "",
          invoice: bookingDetails?.invoice || "",
          adminEmail: bookingDetails?.adminEmail || ""
        }
      ));
    }
    if (channels.includes("push")) {
      promises.push(PushNotificationService.send(title, message));
    }

    await Promise.allSettled(promises);
    return persisted;
  }
}

// Global hook for Supabase Real-time Subscriptions
function initSupabaseRealtimeSub() {
  const client = window.supabaseClient;
  if (!client) return;

  // Clean up any existing active channels first to avoid duplicate listeners & memory leaks
  if (window.supabaseActiveNotificationChannel) {
    client.removeChannel(window.supabaseActiveNotificationChannel);
  }
  if (window.supabaseActiveBookingChannel) {
    client.removeChannel(window.supabaseActiveBookingChannel);
  }

  console.log("Initializing Supabase Real-time subscriptions...");

  // Subscribe to public.notifications
  const notificationChannel = client
    .channel('public:notifications')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications' }, async (payload) => {
      console.log('Realtime Notification Recv:', payload.new);
      const newNot = payload.new;

      // Target checks
      const isForCurrentUser = window.currentUser && (
        newNot.user_id === window.currentUser.id ||
        (window.currentUser.role === 'parent' && window.liveCache?.parent_student_relations?.some(r => r.parent_id === window.currentUser.id && r.player_id === newNot.user_id))
      );

      const isForAdmin = !newNot.user_id && window.isAdminPage;

      if (isForCurrentUser || isForAdmin) {
        if (newNot.channel === 'push' || newNot.type === 'emergency_announcement') {
          PushNotificationService.send(newNot.title, newNot.message);
        }
        if (window.showToast) {
          window.showToast(`🔔 ${newNot.title}: ${newNot.message}`, "info");
        }

        // Refresh portal UI if user is on notification tab
        if (window.currentUser && typeof window.syncNotificationsList === 'function') {
          await window.syncNotificationsList(window.currentUser.role, window.currentUser.id);
        }

        // Refresh header notification dropdown
        if (window.currentUser && typeof window.syncHeaderNotifications === 'function') {
          await window.syncHeaderNotifications(window.currentUser.id, window.currentUser.role);
        }

        // Refresh admin dashboard if bookings are loaded
        if (window.isAdminPage && typeof window.refreshBookings === 'function') {
          await window.refreshBookings();
        }
      }
    })
    .subscribe();

  // Subscribe to public.trial_bookings
  const bookingChannel = client
    .channel('public:trial_bookings')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'trial_bookings' }, async (payload) => {
      console.log('Realtime Booking Recv:', payload.new);
      const newBooking = payload.new;
      if (window.isAdminPage) {
        PushNotificationService.send("New Trial Booking!", `${newBooking.name} scheduled for ${newBooking.booking_date}`);
        if (window.showToast) {
          window.showToast(`📅 New Booking from ${newBooking.name}!`, "success");
        }
        if (typeof window.refreshBookings === 'function') {
          await window.refreshBookings();
        }
      }
    })
    .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'trial_bookings' }, async (payload) => {
      if (window.isAdminPage && typeof window.refreshBookings === 'function') {
        await window.refreshBookings();
      }
    })
    .subscribe();

  window.supabaseActiveNotificationChannel = notificationChannel;
  window.supabaseActiveBookingChannel = bookingChannel;
}

// Global cleanup for Supabase Real-time Subscriptions (on logout)
function cleanupSupabaseRealtimeSub() {
  const client = window.supabaseClient;
  if (!client) return;

  if (window.supabaseActiveNotificationChannel) {
    client.removeChannel(window.supabaseActiveNotificationChannel);
    window.supabaseActiveNotificationChannel = null;
  }
  if (window.supabaseActiveBookingChannel) {
    client.removeChannel(window.supabaseActiveBookingChannel);
    window.supabaseActiveBookingChannel = null;
  }
  console.log("Cleaned up Supabase Real-time subscriptions.");
}

// Bind to window objects
window.WhatsAppNotificationService = WhatsAppNotificationService;
window.EmailNotificationService = EmailNotificationService;
window.PushNotificationService = PushNotificationService;
window.NotificationDispatcher = NotificationDispatcher;
window.initSupabaseRealtimeSub = initSupabaseRealtimeSub;
window.cleanupSupabaseRealtimeSub = cleanupSupabaseRealtimeSub;
window.initSupabaseRealtimeSub = initSupabaseRealtimeSub;

// ==========================================================================
// CONCURRENCY LOCKING & AUDITING API IMPLEMENTATION
// ==========================================================================

function getSessionId() {
  let sessionId = sessionStorage.getItem("rsa_booking_session_id");
  if (!sessionId) {
    sessionId = 'sess-' + Math.random().toString(36).substr(2, 9) + '-' + Date.now();
    sessionStorage.setItem("rsa_booking_session_id", sessionId);
  }
  return sessionId;
}

async function acquireSlotLock(dateStr, slotStr) {
  const client = window.supabaseClient;
  const sessionId = getSessionId();
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString(); // 5 minutes

  if (window.isMockSession || !client) {
    const db = JSON.parse(localStorage.getItem("rsa_db")) || { booking_locks: [] };
    if (!db.booking_locks) db.booking_locks = [];

    // Clear expired and session's own locks
    db.booking_locks = db.booking_locks.filter(l => new Date(l.expires_at) > new Date() && l.session_id !== sessionId);

    // Insert lock
    db.booking_locks.push({
      id: `lock-${Date.now()}`,
      booking_date: dateStr,
      booking_slot: slotStr,
      session_id: sessionId,
      expires_at: expiresAt
    });
    localStorage.setItem("rsa_db", JSON.stringify(db));
    return true;
  }

  try {
    // Delete any active locks for this session first
    await client.from("booking_locks").delete().eq("session_id", sessionId);

    const { error } = await client.from("booking_locks").insert([{
      booking_date: dateStr,
      booking_slot: slotStr,
      session_id: sessionId,
      expires_at: expiresAt
    }]);
    if (error) throw error;
    return true;
  } catch (err) {
    console.error("Error acquiring lock in Supabase:", err);
    return false;
  }
}

async function releaseSlotLock() {
  const client = window.supabaseClient;
  const sessionId = getSessionId();

  if (window.isMockSession || !client) {
    const db = JSON.parse(localStorage.getItem("rsa_db"));
    if (db && db.booking_locks) {
      db.booking_locks = db.booking_locks.filter(l => l.session_id !== sessionId);
      localStorage.setItem("rsa_db", JSON.stringify(db));
    }
    return;
  }

  try {
    await client.from("booking_locks").delete().eq("session_id", sessionId);
  } catch (err) {
    console.error("Error releasing lock in Supabase:", err);
  }
}

async function writeAuditLog(bookingId, action, actor, details) {
  const client = window.supabaseClient;

  if (window.isMockSession || !client) {
    const logEntry = {
      booking_id: bookingId,
      action: action,
      actor: actor,
      details: details || {},
      created_at: new Date().toISOString()
    };
    const db = JSON.parse(localStorage.getItem("rsa_db")) || { audit_logs: [] };
    if (!db.audit_logs) db.audit_logs = [];
    logEntry.id = `audit-${Date.now()}`;
    db.audit_logs.push(logEntry);
    localStorage.setItem("rsa_db", JSON.stringify(db));
    return;
  }

  try {
    const dbEntry = {
      action: action,
      role: actor === 'user' ? 'player' : (actor === 'admin' ? 'admin' : (actor === 'coach' ? 'coach' : 'anonymous')),
      new_value: {
        booking_id: bookingId,
        ...details
      }
    };
    await client.from("audit_logs").insert([dbEntry]);
  } catch (err) {
    console.error("Error writing audit log to Supabase:", err);
  }
}

window.getSessionId = getSessionId;
window.acquireSlotLock = acquireSlotLock;
window.releaseSlotLock = releaseSlotLock;
window.writeAuditLog = writeAuditLog;
