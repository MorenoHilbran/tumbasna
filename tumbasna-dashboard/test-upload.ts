import axios from 'axios';
import FormData from 'form-data';

async function main() {
  const form = new FormData();
  // Create a tiny 1-pixel transparent PNG buffer
  const buffer = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=', 'base64');
  form.append('file', buffer, { filename: 'test.png', contentType: 'image/png' });

  try {
    const res = await axios.post('https://api.tumbasna.my.id/api/upload', form, {
      headers: form.getHeaders(),
    });
    console.log('UPLOAD SUCCESS:', res.data);
  } catch (err: any) {
    console.error('UPLOAD FAILED:', err.response?.data || err.message);
  }
}

main();
