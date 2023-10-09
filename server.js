const express = require('express');
const fs = require('fs');
const https = require('https');
const cheerio = require('cheerio');

const app = express();


const privateKey = fs.readFileSync('cetificates/key.pem', 'utf8');
const certificate = fs.readFileSync('cetificates/cert.pem', 'utf8');
const credentials = { key: privateKey, cert: certificate };


// تعریف فایل استاتیک
app.use(express.static('public'));

// روت کردن فایل
app.get('/', (req, res) => {
  fs.readFile('./public/index.html', (err, data) => {
    if (err) throw err;
    const $ = cheerio.load(data);
    const pageTitle = $('title').text();
    res.send(`Page Title: ${pageTitle}`);
  });
});

const httpsServer = https.createServer(credentials, app);


httpsServer.listen(3200, () => {
  console.log('HTTPS Server running on port 3200');
});

