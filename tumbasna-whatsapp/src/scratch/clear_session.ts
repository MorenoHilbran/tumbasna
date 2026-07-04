import axios from 'axios';

async function main() {
  const phone = '218515084722427';
  try {
    await axios.post('http://127.0.0.1:3000/api/session', {
      phone,
      action: 'DELETE'
    });
    console.log('Session cleared for 218515084722427');
  } catch (err: any) {
    console.error('Error clearing session:', err.message);
  }
}

main();
