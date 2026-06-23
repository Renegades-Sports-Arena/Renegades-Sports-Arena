async function sendEmail(to, subject, html) {
    try {
        const response = await fetch(
            window.env.EMAIL_FUNCTION_URL,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${window.env.SUPABASE_KEY}`,
                    "apikey": window.env.SUPABASE_KEY
                },
                body: JSON.stringify({
                    to,
                    subject,
                    html
                })
            }
        );

        if (!response.ok) {
            throw new Error(`Edge Function returned HTTP ${response.status}`);
        }
        return await response.json();
    } catch (err) {
        console.error("Email Error:", err);
        throw err; // Propagate error so outer catch knows it failed
    }
}

//// EMAIL NOTIFICATIONS
//// PLAYER CONFIRMATION
function generatePlayerEmailHTML(details) {
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Trial Session Confirmed | Renegades Sports Arena</title>
        <style>
            body {
                font-family: 'Outfit', 'Inter', 'Segoe UI', Arial, sans-serif;
                background-color: #0c0c0e;
                margin: 0;
                padding: 0;
                color: #e2e8f0;
                -webkit-font-smoothing: antialiased;
            }
            .email-container {
                max-width: 600px;
                margin: 40px auto;
                background-color: #121216;
                border-radius: 20px;
                overflow: hidden;
                box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5);
                border: 1px solid rgba(255, 107, 0, 0.15);
            }
            .email-header {
                background: linear-gradient(135deg, #ff6b00 0%, #cc5200 100%);
                padding: 40px 30px;
                text-align: center;
                border-bottom: 3px solid #ff7b1a;
            }
            .email-header img {
                height: 60px;
                margin-bottom: 15px;
            }
            .email-header h1 {
                margin: 0;
                font-size: 26px;
                font-weight: 800;
                color: #ffffff;
                text-transform: uppercase;
                letter-spacing: 1.5px;
                text-shadow: 0 2px 4px rgba(0,0,0,0.3);
            }
            .email-body {
                padding: 40px 30px;
                background: radial-gradient(circle at top right, rgba(255, 107, 0, 0.03) 0%, transparent 70%);
            }
            .greeting {
                font-size: 18px;
                color: #ffffff;
                margin-bottom: 25px;
                line-height: 1.5;
            }
            .intro-text {
                font-size: 15px;
                line-height: 1.6;
                color: #94a3b8;
                margin-bottom: 30px;
            }
            .details-card {
                background-color: #1e1e24;
                border-radius: 16px;
                padding: 25px;
                margin-bottom: 35px;
                border: 1px solid rgba(255, 255, 255, 0.03);
                box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
            }
            .detail-item {
                display: flex;
                margin-bottom: 15px;
                border-bottom: 1px solid rgba(255, 255, 255, 0.05);
                padding-bottom: 12px;
            }
            .detail-item:last-child {
                margin-bottom: 0;
                border-bottom: none;
                padding-bottom: 0;
            }
            .detail-label {
                width: 120px;
                font-size: 13px;
                font-weight: 700;
                color: #ff6b00;
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }
            .detail-val {
                flex: 1;
                font-size: 15px;
                color: #ffffff;
                font-weight: 600;
            }
            .instructions-box {
                background: rgba(255, 107, 0, 0.04);
                border-left: 4px solid #ff6b00;
                border-radius: 4px 12px 12px 4px;
                padding: 20px;
                margin-bottom: 35px;
            }
            .instructions-title {
                font-size: 15px;
                font-weight: 700;
                color: #ffffff;
                margin-top: 0;
                margin-bottom: 10px;
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }
            .instructions-list {
                margin: 0;
                padding-left: 20px;
                color: #cbd5e1;
                font-size: 14px;
                line-height: 1.6;
            }
            .instructions-list li {
                margin-bottom: 8px;
            }
            .instructions-list li:last-child {
                margin-bottom: 0;
            }
            .tagline-container {
                text-align: center;
                margin: 40px 0 20px;
                padding-top: 25px;
                border-top: 1px solid rgba(255, 255, 255, 0.05);
            }
            .tagline {
                font-size: 20px;
                font-weight: 900;
                color: #ff6b00;
                text-transform: uppercase;
                letter-spacing: 3px;
                margin: 0;
            }
            .email-footer {
                background-color: #09090b;
                padding: 30px;
                text-align: center;
                border-top: 1px solid rgba(255, 255, 255, 0.05);
            }
            .footer-links {
                margin-bottom: 15px;
            }
            .footer-links a {
                color: #94a3b8;
                text-decoration: none;
                font-size: 12px;
                margin: 0 10px;
                transition: color 0.2s;
            }
            .footer-links a:hover {
                color: #ff6b00;
            }
            .footer-info {
                font-size: 12px;
                color: #64748b;
                line-height: 1.5;
            }
        </style>
    </head>
    <body>
        <div class="email-container">
            <div class="email-header">
                <!-- Fallback to text logo if image is loading -->
                <div style="font-size: 22px; font-weight: 900; letter-spacing: 2px; color: #fff; margin-bottom: 8px; font-family: 'Impact', sans-serif;">RENEGADES SPORTS ARENA</div>
                <h1>TRIAL CONFIRMED</h1>
            </div>
            <div class="email-body">
                <div class="greeting">Hello ${details.name},</div>
                <div class="intro-text">
                    Your request for a free turf trial session has been confirmed! We are thrilled to welcome you to our high-performance training grounds. Below are your session schedule and reporting details.
                </div>
                
                <div class="details-card">
                    <div class="detail-item">
                        <div class="detail-label">Player</div>
                        <div class="detail-val">${details.name}</div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-label">Date</div>
                        <div class="detail-val">${details.date}</div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-label">Time Slot</div>
                        <div class="detail-val">${details.slot}</div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-label">Venue</div>
                        <div class="detail-val">Renegades Sports Arena, Byandahalli, Bengaluru, 562130</div>
                    </div>
                </div>

                <div class="instructions-box">
                    <div class="instructions-title">💡 Reporting Instructions</div>
                    <ul class="instructions-list">
                        <li>Please report at the venue exactly <strong>10 minutes prior</strong> to your scheduled slot.</li>
                        <li>Ensure you bring proper sports/athletic shoes (suitable for Astro Turf nets).</li>
                        <li>Carry a personal sports water bottle to keep yourself hydrated during the training drills.</li>
                    </ul>
                </div>

                <div class="tagline-container">
                    <p class="tagline">Focus • Train • Dominate</p>
                </div>
            </div>
            <div class="email-footer">
                <div class="footer-links">
                    <a href="https://www.instagram.com/p/DYlwjXOxmg2/?igsh=MThxNWJkbWRqNDRodA==" target="_blank">Instagram</a>
                    <a href="mailto:renegadessportsarena@gmail.com">Contact Us</a>
                </div>
                <div class="footer-info">
                    &copy; 2026 Renegades Sports Arena. All Rights Reserved.<br>
                    Byandahalli, Bengaluru, Karnataka 562130
                </div>
            </div>
        </div>
    </body>
    </html>
    `;
}

//// ADMIN NOTIFICATION
function generateAdminEmailHTML(details) {
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>New Trial Booking Received</title>
        <style>
            body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                background-color: #f8fafc;
                margin: 0;
                padding: 20px;
                color: #334155;
            }
            .card {
                max-width: 600px;
                margin: 20px auto;
                background-color: #ffffff;
                border-radius: 12px;
                overflow: hidden;
                box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
                border: 1px solid #e2e8f0;
            }
            .header {
                background-color: #0f172a;
                color: #ffffff;
                padding: 25px;
                text-align: center;
            }
            .header h2 {
                margin: 0;
                font-size: 20px;
                font-weight: 700;
                letter-spacing: 0.5px;
            }
            .body {
                padding: 30px;
            }
            .alert-banner {
                background-color: #fff7ed;
                border: 1px solid #ffedd5;
                color: #c2410c;
                padding: 12px 18px;
                border-radius: 8px;
                font-size: 14px;
                font-weight: 600;
                margin-bottom: 25px;
                display: flex;
                align-items: center;
                gap: 8px;
            }
            table {
                width: 100%;
                border-collapse: collapse;
                margin-bottom: 20px;
            }
            th, td {
                padding: 12px 15px;
                text-align: left;
                font-size: 14px;
            }
            th {
                color: #64748b;
                font-weight: 600;
                width: 35%;
                border-bottom: 1px solid #f1f5f9;
            }
            td {
                color: #0f172a;
                font-weight: 500;
                border-bottom: 1px solid #f1f5f9;
            }
            tr:last-child th, tr:last-child td {
                border-bottom: none;
            }
            .message-box {
                background-color: #f1f5f9;
                border-radius: 8px;
                padding: 15px;
                font-size: 13px;
                color: #475569;
                line-height: 1.6;
                border: 1px solid #e2e8f0;
                white-space: pre-wrap;
            }
            .footer {
                background-color: #f8fafc;
                padding: 20px;
                text-align: center;
                font-size: 11px;
                color: #94a3b8;
                border-top: 1px solid #e2e8f0;
            }
        </style>
    </head>
    <body>
        <div class="card">
            <div class="header">
                <h2>🔥 New Trial Booking Received</h2>
            </div>
            <div class="body">
                <div class="alert-banner">
                    ⚡ A new player has registered for a free trial session on the website.
                </div>
                
                <table>
                    <tr>
                        <th>Player Name</th>
                        <td>${details.name}</td>
                    </tr>
                    <tr>
                        <th>Age of Student</th>
                        <td>${details.age} years</td>
                    </tr>
                    <tr>
                        <th>Parent Name</th>
                        <td>${details.parentName || 'N/A'}</td>
                    </tr>
                    <tr>
                        <th>Email Address</th>
                        <td><a href="mailto:${details.email}" style="color: #ff6b00; text-decoration: none;">${details.email}</a></td>
                    </tr>
                    <tr>
                        <th>WhatsApp/Phone</th>
                        <td><a href="tel:${details.phone}" style="color: #ff6b00; text-decoration: none;">${details.phone}</a></td>
                    </tr>
                    <tr>
                        <th>Skill Level</th>
                        <td>${details.skillLevel}</td>
                    </tr>
                    <tr>
                        <th>Booking Date</th>
                        <td><strong>${details.date}</strong></td>
                    </tr>
                    <tr>
                        <th>Time Slot</th>
                        <td><strong>${details.slot}</strong></td>
                    </tr>
                    <tr>
                        <th>Timestamp</th>
                        <td>${details.timestamp}</td>
                    </tr>
                </table>

                <div style="font-size: 12px; font-weight: 700; color: #64748b; margin-top: 25px; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.5px;">Message/Details:</div>
                <div class="message-box">${details.message || 'No details provided.'}</div>
            </div>
            <div class="footer">
                This is an automated operational notification sent from Renegades Sports Arena Platform.
            </div>
        </div>
    </body>
    </html>
    `;
}

async function sendTrialBookingEmails(details) {
    console.log("[Email Service] Initiating trial booking notification dispatches...");
    
    // 1. Generate HTML payloads
    const playerHtml = generatePlayerEmailHTML(details);
    const adminHtml = generateAdminEmailHTML(details);

    let playerSuccess = false;
    let adminSuccess = false;

    // Send to Player
    try {
        console.log(`[Email Service] Dispatching player confirmation email to: ${details.email}`);
        await sendEmail(
            details.email, 
            "🏏 Trial Session Confirmed | Renegades Sports Arena", 
            playerHtml
        );
        playerSuccess = true;
        console.log("[Email Service] Player confirmation email sent successfully.");
    } catch (err) {
        console.error("[Email Service] Failed to send player confirmation email:", err);
    }

    // Send to Admin
    try {
        console.log(`[Email Service] Dispatching admin notification email to: ${details.adminEmail}`);
        await sendEmail(
            details.adminEmail, 
            "🔥 New Trial Booking Received", 
            adminHtml
        );
        adminSuccess = true;
        console.log("[Email Service] Admin notification email sent successfully.");
    } catch (err) {
        console.error("[Email Service] Failed to send admin notification email:", err);
    }

    // Return status
    return {
        playerSuccess,
        adminSuccess,
        allSuccess: playerSuccess && adminSuccess
    };
}

// Bind to window object to expose globally
window.generatePlayerEmailHTML = generatePlayerEmailHTML;
window.generateAdminEmailHTML = generateAdminEmailHTML;
window.sendTrialBookingEmails = sendTrialBookingEmails;