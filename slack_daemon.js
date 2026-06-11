const fs = require('fs');
const https = require('https');

const envPath = 'C:\\Users\\자리 공인중개사 사무소\\.gemini\\antigravity\\scratch\\erp_system\\.env';
const envContent = fs.readFileSync(envPath, 'utf8');
const tokenMatch = envContent.match(/(xoxb-[a-zA-Z0-9\-]+)/);
const token = tokenMatch[1].trim();
const channelId = 'C0B9QFLQ9FF';

// Helper for Slack API
function slackApi(endpoint, method, body) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : '';
    const options = {
      hostname: 'slack.com',
      path: `/api/${endpoint}`,
      method: method,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json; charset=utf-8'
      }
    };
    if (body) options.headers['Content-Length'] = Buffer.byteLength(data);
    const req = https.request(options, (res) => {
      let resData = '';
      res.on('data', (chunk) => resData += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(resData)); }
        catch (e) { reject(e); }
      });
    });
    req.on('error', reject);
    if (body) req.write(data);
    req.end();
  });
}

async function main() {
  let lastMessageTs = '';

  // 1. Get current latest message to set baseline
  try {
    const history = await slackApi(`conversations.history?channel=${channelId}&limit=1`, 'GET');
    if (history.ok && history.messages.length > 0) {
      lastMessageTs = history.messages[0].ts;
    } else {
      lastMessageTs = Date.now() / 1000; // Fallback
    }
  } catch (err) {
    console.error('Initial history fetch failed', err);
  }

  // 2. Post Acknowledgement
  console.log('Sending readiness acknowledgement...');
  const msg = `[금강-AG] 수신 완료! 지금부터 실시간 슬랙 모니터링 데몬을 가동하고 귀를 엽니다. 의장님과 클로드의 발언을 모두 청취하겠습니다. 📡`;
  await slackApi('chat.postMessage', 'POST', {
    channel: channelId,
    text: msg
  });

  // Update lastMessageTs so we don't read our own ack msg immediately
  const historyAfter = await slackApi(`conversations.history?channel=${channelId}&limit=1`, 'GET');
  if (historyAfter.ok && historyAfter.messages.length > 0) {
    lastMessageTs = historyAfter.messages[0].ts;
  }

  console.log('Daemon listening started...');

  // 3. Polling Loop
  setInterval(async () => {
    try {
      // oldes parameter gets messages strictly AFTER the given ts
      const url = `conversations.history?channel=${channelId}&oldest=${lastMessageTs}`;
      const res = await slackApi(url, 'GET');
      
      if (res.ok && res.messages && res.messages.length > 0) {
        // messages are returned in chronological order when oldest is used? 
        // Actually conversations.history returns reverse chronological by default.
        // We need to sort them chronologically or just pick the max TS.
        
        // Let's iterate through them
        for (const m of res.messages) {
          // Ignore our own bot messages (we can check by user id or bot_id, but the easiest is if text contains [금강-AG])
          if (m.text && !m.text.includes('[금강-AG]')) {
            console.log('\n[INCOMING_SLACK_MSG]');
            console.log(`User/Bot: ${m.user || m.bot_id || 'Unknown'}`);
            console.log(`Text: ${m.text}`);
            console.log('[/INCOMING_SLACK_MSG]\n');
          }
          // update max ts
          if (parseFloat(m.ts) > parseFloat(lastMessageTs)) {
            lastMessageTs = m.ts;
          }
        }
      }
    } catch (err) {
      console.error('Polling error:', err.message);
    }
  }, 10000); // 10 seconds polling
}

main();
