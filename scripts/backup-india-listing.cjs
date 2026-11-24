const fs = require('fs');
const path = require('path');

const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const backupPath = path.join(__dirname, '..', 'backups', `india-listing-${timestamp}.json`);

const evidence = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'public', 'seo-evidence.json'), 'utf8'));
const firmsData = require(path.join(__dirname, '..', 'public', 'firms-data.js'));

const indianEvidenceFirms = {};
for (const [slug, f] of Object.entries(evidence.firms || {})) {
  if (f.bestRegions?.india === true || f.country === 'India' || (Array.isArray(f.tags) && f.tags.some(t => String(t).toLowerCase().includes('india')))) {
    indianEvidenceFirms[slug] = f;
  }
}

const backupData = {
  timestamp: new Date().toISOString(),
  description: 'Backup of all India-tagged firms prior to replacing with Trade Bridges only',
  indianEvidenceFirms,
  defaultListedFirms: firmsData.DEFAULT_LISTED_FIRMS.filter(f => f.bestRegions?.india === true),
  defaultBestFirms: firmsData.DEFAULT_BEST_FIRMS.filter(f => f.bestRegions?.india === true)
};

fs.writeFileSync(backupPath, JSON.stringify(backupData, null, 2), 'utf8');
const stats = fs.statSync(backupPath);
console.log('Backup created successfully:', backupPath, 'Size:', stats.size, 'bytes');
