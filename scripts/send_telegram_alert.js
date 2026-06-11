const https = require('https');
const fs = require('fs');
const path = require('path');

const configPath = path.join(__dirname, '..', '..', 'telegram_config.json');
if (!fs.existsSync(configPath)) {
  console.error('telegram_config.json not found');
  process.exit(1);
}

const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
const TOKEN = config.botToken;
const CHAT_ID = config.chatId;

// node send_telegram_alert.js "Message Text" "Option1" "Option2" ...
const args = process.argv.slice(2);
if (args.length === 0) {
  console.error("Usage: node send_telegram_alert.js <message> [option1] [option2] ...");
  process.exit(1);
}

const message = args[0];
const options = args.slice(1);

const body = {
  chat_id: CHAT_ID,
  text: message,
  parse_mode: "Markdown"
};

if (options.length > 0) {
  const keyboard = options.map((opt, index) => {
    return [{ text: opt, callback_data: `OPTION_${index}` }];
  });
  body.reply_markup = { inline_keyboard: keyboard };
  
  // Save mapping to read later
  fs.writeFileSync(path.join(__dirname, '..', '..', 'telegram_options.json'), JSON.stringify(options));
}

const data = JSON.stringify(body);

const req = https.request({
  hostname: 'api.telegram.org',
  path: `/bot${TOKEN}/sendMessage`,
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
}, (res) => {
  let responseData = '';
  res.on('data', chunk => responseData += chunk);
  res.on('end', () => {
    console.log("Message sent successfully:", responseData);
  });
});

req.on('error', error => {
  console.error("Error sending message:", error);
});

req.write(data);
req.end();
