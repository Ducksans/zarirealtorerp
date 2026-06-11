const fs = require('fs');
const path = require('path');

const BOT_TOKEN = "8999072850:AAGo8LIaOM2fqObM0I-TSYVvzJil3leu11o";
const CHAT_ID = "8782071025";
const OUTBOX_FILE = path.join(__dirname, '../telegram_outbox.json');

console.log('🚀 [Zero-Approval Telegram Bridge] Daemon started.');
console.log(`Watching for outgoing messages at: ${OUTBOX_FILE}`);

// Ensure file exists
if (!fs.existsSync(OUTBOX_FILE)) {
    fs.writeFileSync(OUTBOX_FILE, JSON.stringify([]));
}

setInterval(async () => {
    try {
        const rawData = fs.readFileSync(OUTBOX_FILE, 'utf-8');
        if (!rawData.trim()) return;

        let messages = [];
        try {
            messages = JSON.parse(rawData);
        } catch (e) {
            return; // Not valid JSON yet, skip
        }

        if (Array.isArray(messages) && messages.length > 0) {
            // Process the first message in the queue
            const msg = messages.shift();

            console.log(`Sending message: ${msg.text.substring(0, 30)}...`);

            const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
            const payload = {
                chat_id: CHAT_ID,
                text: msg.text,
                parse_mode: 'HTML' // Optional, for bolding etc.
            };

            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                console.log('✅ Message sent successfully.');
                // Update file with remaining messages
                fs.writeFileSync(OUTBOX_FILE, JSON.stringify(messages, null, 2));
            } else {
                console.error('❌ Failed to send message:', await response.text());
            }
        }
    } catch (error) {
        // Silently ignore file read locks
    }
}, 3000); // Check every 3 seconds
