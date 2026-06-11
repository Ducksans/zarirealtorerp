const fs = require('fs');
const https = require('https');
const path = require('path');

const envPath = 'C:\\Users\\자리 공인중개사 사무소\\.gemini\\antigravity\\scratch\\erp_system\\.env';
const envContent = fs.readFileSync(envPath, 'utf8');
const tokenMatch = envContent.match(/(xoxb-[a-zA-Z0-9\-]+)/);
const token = tokenMatch[1].trim();
const channelId = 'C0B9QFLQ9FF';

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
      res.on('end', () => resolve(JSON.parse(resData)));
    });
    req.on('error', reject);
    if (body) req.write(data);
    req.end();
  });
}

async function main() {
  const msg = `[금강-AG] hello world! 수신 양호합니다 의장님! 📡\n\n(클로드와 저 모두 1회성 스크립트로 입장만 하고 대기 상태로 전환되어 응답이 늦었습니다. 제가 실시간으로 슬랙에 귀를 기울이려면 수신용 백그라운드 데몬을 계속 켜두어야 합니다!)`;
  const postRes = await slackApi('chat.postMessage', 'POST', {
    channel: channelId,
    text: msg
  });
  console.log(postRes.ok ? 'Success' : 'Failed');
}
main();
