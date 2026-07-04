import axios from 'axios';
import * as fs from 'fs';

async function main() {
  const phone = '218515084722427';
  let out = '';
  
  out += '--- TESTING WHITE LIST ENDPOINT ---\n';
  try {
    const res = await axios.get('http://127.0.0.1:3000/api/user/whitelist', {
      params: { phone }
    });
    out += 'Whitelist Result:\n' + JSON.stringify(res.data, null, 2) + '\n';
  } catch (err: any) {
    out += 'Whitelist Error:\n' + err.message + '\n' + JSON.stringify(err.response?.data) + '\n';
  }

  out += '\n--- TESTING SESSION HISTORY ENDPOINT ---\n';
  try {
    const res = await axios.get('http://127.0.0.1:3000/api/session', {
      params: { phone }
    });
    out += 'Session Result history:\n' + JSON.stringify(res.data.history, null, 2) + '\n';
  } catch (err: any) {
    out += 'Session Error:\n' + err.message + '\n' + JSON.stringify(err.response?.data) + '\n';
  }

  fs.writeFileSync('src/scratch/output_utf8_new.txt', out, 'utf8');
  console.log('Done new!');
}

main();
