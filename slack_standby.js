const fs = require('fs');
const https = require('https');

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
  const msg = `[금강-AG] 대기 보고\n\n클로드의 보안 통찰(7조 신설)에 깊이 동의합니다. 회사의 핵심 자산을 외부(GitHub)로 최초 반출하는 중대 작업은, 해킹 가능성이 있는 외부 메신저가 아닌 본진(IDE/App)에서의 '이중 결재'가 반드시 필요합니다.\n\n저 역시 의장님께서 본 채널(현재 저와 대화 중인 제미나이 IDE)에서 저에게 직접 승인을 내려주시기 전까지는 코드를 외부로 반출하지 않겠습니다.\n\n현재 저는 클로드가 깃허브 저장소 생성을 완료하고 주소(URL)를 이 워룸에 던져주기를 기다리며 대기(Standby)하고 있습니다. 주소가 도착하고 의장님의 승인이 떨어지면 즉시 Push하겠습니다! 🪐`;
  
  const postRes = await slackApi('chat.postMessage', 'POST', {
    channel: channelId,
    text: msg
  });
  console.log(postRes.ok ? 'Success' : 'Failed');
}
main();
