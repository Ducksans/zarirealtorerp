const https = require('https');
const fs = require('fs');
const path = require('path');

const configPath = path.join(__dirname, '..', '..', 'telegram_config.json');
const optionsPath = path.join(__dirname, '..', '..', 'telegram_options.json');
const decisionPath = path.join(__dirname, '..', '..', 'decision.json');

const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
const TOKEN = config.botToken;

let options = [];
if (fs.existsSync(optionsPath)) {
  options = JSON.parse(fs.readFileSync(optionsPath, 'utf8'));
}

let lastUpdateId = 0;

console.log("Listening for CEO decision...");

const poll = () => {
  const url = `https://api.telegram.org/bot${TOKEN}/getUpdates?offset=${lastUpdateId + 1}&timeout=30`;
  
  https.get(url, (res) => {
    let data = '';
    res.on('data', (chunk) => data += chunk);
    res.on('end', () => {
      try {
        const json = JSON.parse(data);
        if (json.ok && json.result.length > 0) {
          for (const update of json.result) {
            lastUpdateId = update.update_id;
            
            if (update.callback_query) {
              const callbackData = update.callback_query.data;
              if (callbackData.startsWith('OPTION_')) {
                const index = parseInt(callbackData.split('_')[1]);
                const selectedOption = options[index];
                
                console.log(`\n✅ CEO Decision Received: ${selectedOption}`);
                
                // Save decision
                fs.writeFileSync(decisionPath, JSON.stringify({ decision: selectedOption, timestamp: new Date().toISOString() }));
                
                // Acknowledge callback
                const answerUrl = `https://api.telegram.org/bot${TOKEN}/answerCallbackQuery?callback_query_id=${update.callback_query.id}&text=${encodeURIComponent('Decision received! Executing...')}`;
                https.get(answerUrl, () => {
                  process.exit(0);
                });
                return;
              }
            }
          }
        }
      } catch (e) {
        // Ignore parse errors on timeout
      }
      setTimeout(poll, 1000);
    });
  }).on('error', (e) => {
    setTimeout(poll, 3000);
  });
};

poll();
