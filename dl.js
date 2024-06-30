const mysql = require('mysql2');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

// MySQL connection setup
const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'etz'
});

// Query to fetch airline codes
const fetchAirlineCodes = () => {
    return new Promise((resolve, reject) => {
      connection.query('SELECT iata FROM airlinesdata', (error, results) => {
        if (error) {
          return reject(error);
        }
        resolve(results.map(row => row.iata));
      });
    });
  };
  
  // Download an image from a URL and save it to a specified path
  const downloadImage = async (url, filepath) => {
    const response = await axios({
      url,
      responseType: 'stream',
    });
    return new Promise((resolve, reject) => {
      const writer = fs.createWriteStream(filepath);
      response.data.pipe(writer);
      writer.on('finish', resolve);
      writer.on('error', reject);
    });
  };
  
  // Main function to fetch airline codes and download images
  const main = async () => {
    try {
      const airlineCodes = await fetchAirlineCodes();
      const downloadPromises = airlineCodes.map(async (code) => {
        const url = `https://tbbd-flight.s3.ap-southeast-1.amazonaws.com/airlines-logo/${code}.png`;
        const filepath = path.join(__dirname, 'logos', `${code}.png`);
        console.log(`Downloading ${url}`);
        await downloadImage(url, filepath);
      });
  
      // Ensure 'logos' directory exists
      if (!fs.existsSync('logos')) {
        fs.mkdirSync('logos');
      }
  
      await Promise.all(downloadPromises);
      console.log('All images downloaded successfully.');
    } catch (error) {
      console.error('An error occurred:', error);
    } finally {
      connection.end();
    }
  };
  
  main();