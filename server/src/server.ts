import { app } from './app.js';
import { config } from './config.js';

const PORT = config.port;

app.listen(PORT, () => {
  console.log(`🚀 Gold Loan Portal API listening on port ${PORT}`);
  console.log(`📈 Mock 24K Gold Rate set to ₹${config.goldRate24k}/g`);
  console.log(`🤖 AI Agent Provider: ${config.llmProvider}`);
});
