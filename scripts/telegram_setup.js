const https = require('https');
const fs = require('fs');

const TOKEN = '8999072850:AAGo8LIaOM2fqObM0I-TSYVvzJiL3leu1lo';
const URL = `https://api.telegram.org/bot${TOKEN}/getUpdates`;

console.log("대기 중... 대표님이 봇에게 메시지를 보내기를 기다리고 있습니다.");

const poll = () => {
  https.get(URL, (res) => {
    let data = '';
    res.on('data', (chunk) => data += chunk);
    res.on('end', () => {
      try {
        const json = JSON.parse(data);
        if (json.ok && json.result.length > 0) {
          // Get the last message
          const lastUpdate = json.result[json.result.length - 1];
          const chatId = lastUpdate.message.chat.id;
          
          console.log(`성공! CHAT_ID를 찾았습니다: ${chatId}`);
          
          // Save configuration
          const config = {
            botToken: TOKEN,
            chatId: chatId
          };
          
          fs.writeFileSync('C:\\Users\\자리 공인중개사 사무소\\.gemini\\antigravity\\scratch\\telegram_config.json', JSON.stringify(config, null, 2));
          console.log('설정이 telegram_config.json에 저장되었습니다.');
          
          // Send a welcome message
          const sendUrl = `https://api.telegram.org/bot${TOKEN}/sendMessage?chat_id=${chatId}&text=${encodeURIComponent('🚀 [Zari ERP] 모바일 커맨드 센터 연결이 성공적으로 완료되었습니다! 이제부터 이곳으로 보고 및 결재 요청이 전송됩니다.')}`;
          https.get(sendUrl, () => {
            console.log("환영 메시지를 전송했습니다. 스크립트를 종료합니다.");
            process.exit(0);
          });
        } else {
          // Keep polling every 3 seconds
          setTimeout(poll, 3000);
        }
      } catch (e) {
        console.error("JSON 파싱 에러:", e);
        setTimeout(poll, 3000);
      }
    });
  }).on('error', (e) => {
    console.error("API 요청 에러:", e);
    setTimeout(poll, 3000);
  });
};

poll();
