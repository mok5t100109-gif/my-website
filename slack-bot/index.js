const { App } = require('@slack/bolt');
require('dotenv').config({ path: '../.env' });

const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  socketMode: true,
  appToken: process.env.SLACK_APP_TOKEN,
  port: process.env.PORT || 3000,
});

// Respond to direct messages and mentions
app.message('hello', async ({ message, say }) => {
  await say({
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `こんにちは、<@${message.user}> さん！ :wave:\nサロンポートフォリオへようこそ！`,
        },
      },
    ],
    text: `こんにちは、<@${message.user}> さん！`,
  });
});

// Respond to app mentions (@claude-bot)
app.event('app_mention', async ({ event, say }) => {
  await say({
    text: `<@${event.user}> さん、何かお手伝いできますか？`,
  });
});

(async () => {
  await app.start();
  console.log('claude-bot が起動しました！');
})();
