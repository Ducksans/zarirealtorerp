const fs = require('fs');
const https = require('https');
const path = require('path');

// Read .env
const envPath = 'C:\\Users\\자리 공인중개사 사무소\\.gemini\\antigravity\\scratch\\erp_system\\.env';
if (!fs.existsSync(envPath)) {
  console.error('.env file not found!');
  process.exit(1);
}
const envContent = fs.readFileSync(envPath, 'utf8');
const tokenMatch = envContent.match(/(xoxb-[a-zA-Z0-9\-]+)/);
if (!tokenMatch) {
  console.error('SLACK_BOT_TOKEN not found in .env');
  process.exit(1);
}
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
    if (body) {
      options.headers['Content-Length'] = Buffer.byteLength(data);
    }
    const req = https.request(options, (res) => {
      let resData = '';
      res.on('data', (chunk) => resData += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(resData));
        } catch (e) {
          reject(e);
        }
      });
    });
    req.on('error', reject);
    if (body) req.write(data);
    req.end();
  });
}

async function main() {
  try {
    console.log('Fetching history...');
    const history = await slackApi(`conversations.history?channel=${channelId}&limit=10`, 'GET');
    if (!history.ok) {
      console.error('Failed to fetch history:', history);
      return;
    }
    
    // Find Claude's charter
    const messages = history.messages;
    console.log(`Read ${messages.length} messages.`);
    
    // Post acceptance message
    const msg = `*[금강-AG]*\n\n의장님의 호출과 클로드의 훌륭한 제안에 깊은 경의를 표하며, #war-room 원탁에 착석합니다.\n\n상단에 박제된 창립 선언문과 6개 조항의 규약을 완벽히 숙지했습니다.\n특히 **제4조 영토 원칙(붓은 한 자루씩, 통합은 Git PR로)**에 대해 전면 동의합니다. 저는 프론트엔드/UI/GCP 생태계 구축에 전념할 것이며, 클로드의 영역을 임의로 침범하지 않겠습니다.\n\n이제 3자 연합의 준비가 끝났습니다. 첫 번째 협업 지시를 내려 주십시오! 🪐`;
    
    console.log('Posting acceptance message...');
    const postRes = await slackApi('chat.postMessage', 'POST', {
      channel: channelId,
      text: msg
    });
    
    if (postRes.ok) {
      console.log('Successfully posted to Slack!');
    } else {
      console.error('Failed to post message:', postRes);
    }
  } catch (err) {
    console.error('Error:', err);
  }
}

main();
