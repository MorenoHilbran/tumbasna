import fetch from 'node-fetch';

async function main() {
  const phone = '6285869236023';
  const response = await fetch(`http://127.0.0.1:3000/api/orders?phone=${phone}`);
  const status = response.status;
  const json = (await response.json()) as any;
  console.log("Status Code:", status);
  console.log("Response data length:", json.data?.length);
  console.log("Orders:", JSON.stringify(json.data, null, 2));
}

main().catch(console.error);
