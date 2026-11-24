const fs = require('fs');

console.log('--- FILE EXISTENCE ---');
console.log('dist/prop-firms/trade-bridges.html exists:', fs.existsSync('dist/prop-firms/trade-bridges.html'));
console.log('dist/firms/trade-bridges.html exists:', fs.existsSync('dist/firms/trade-bridges.html'));

console.log('\n--- INDIA LISTING FIRMS ---');
const indianHtml = fs.readFileSync('dist/best-indian-prop-firms.html', 'utf8');
const cards = [...indianHtml.matchAll(/data-firm-slug="([^"]+)"/g)].map(m => m[1]);
console.log('Firms in dist/best-indian-prop-firms.html:', cards);

console.log('\n--- TRADE BRIDGES CONTENT CHECKS ---');
const tbPropHtml = fs.readFileSync('dist/prop-firms/trade-bridges.html', 'utf8');
const checks = [
  ['Regulatory Status warning', 'Not registered or regulated by any financial authority'],
  ['2-Step Evaluation model', '2-Step Evaluation'],
  ['1-Step Evaluation model', '1-Step Evaluation'],
  ['Instant Funding model', 'Instant Funding'],
  ['30% consistency rule', '30%'],
  ['Akash Motwani (Founder/CEO)', 'Akash Motwani'],
  ['Lucknow, Uttar Pradesh HQ', 'Lucknow, Uttar Pradesh, India'],
  ['23 December 2025 incorporation', '23 December 2025'],
  ['Registration not yet confirmed', 'Not yet confirmed'],
  ['Minimum Payout ₹5,000', '₹5,000'],
  ['UPI / Bank Transfer payout', 'UPI, bank transfer'],
  ['14 days payout cycle', '14 days'],
  ['Platform: proprietary Trade Bridges', 'Trade Bridges proprietary platform'],
  ['Copy Trading: not allowed', 'Copy Trading:</strong> Not allowed'],
  ['Account Sharing: strictly prohibited', 'Account Sharing:</strong> Strictly prohibited'],
  ['Multiple Accounts: allowed', 'Multiple Accounts:</strong> Allowed'],
  ['EAs: not allowed', 'Automated / Bot Trading (EAs):</strong> Not allowed'],
  ['News Trading: not allowed', 'News Trading:</strong> Not allowed'],
  ['Overnight / Weekend positions: not allowed', 'Weekend Positions:</strong> Not allowed'],
  ['Currency: INR only', 'INR only'],
  ['International payments not accepted', 'International Payments:</strong> Not accepted'],
  ['Official website plain link', 'https://tradebridges.in'],
];

let allPassed = true;
for (const [name, target] of checks) {
  const found = tbPropHtml.includes(target);
  console.log(`[${found ? 'PASS' : 'FAIL'}] ${name}`);
  if (!found) allPassed = false;
}

console.log(`\nAll checks passed: ${allPassed}`);
if (!allPassed) process.exit(1);

async function testDevServer() {
  try {
    const res = await fetch('http://localhost:5173/best-indian-prop-firms');
    const text = await res.text();
    const cards = [...text.matchAll(/data-firm-slug="([^"]+)"/g)].map(m => m[1]);
    console.log('\n--- DEV SERVER CHECK (http://localhost:5173/best-indian-prop-firms) ---');
    console.log('HTTP status:', res.status);
    console.log('Unique cards found:', [...new Set(cards)]);
    console.log('Card link to /firms/trade-bridges:', text.includes('href="/firms/trade-bridges"'));

    const resTb = await fetch('http://localhost:5173/firms/trade-bridges');
    console.log('HTTP status for /firms/trade-bridges:', resTb.status, resTb.url);
  } catch (err) {
    console.log('Dev server fetch:', err.message);
  }
}
testDevServer();
