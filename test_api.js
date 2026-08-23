import http from 'http';

const urls = [
  "http://localhost:5000/login",
  "http://localhost:5000/assets/index-BZbI8Deb.css",
  "http://localhost:5000/assets/index-BZbI8Deb.css'"
];

async function test(url) {
  return new Promise((resolve) => {
    http.get(url, (res) => {
      console.log(`URL: ${url}`);
      console.log(`Status: ${res.statusCode}`);
      console.log(`Content-Type: ${res.headers["content-type"]}`);
      console.log("-----------------------------------------");
      resolve();
    }).on("error", (e) => {
      console.log(`URL: ${url}`);
      console.log(`Error: ${e.message}`);
      console.log("-----------------------------------------");
      resolve();
    });
  });
}

(async () => {
  for (const url of urls) {
    await test(url);
  }
})();
