const fs = require('fs');
const https = require('https');

const url = 'https://raw.githubusercontent.com/kenzouno1/DiaGioiHanhChinhVN/master/data.json';

https.get(url, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    try {
      const allData = JSON.parse(data);
      const ngheAn = allData.find(p => p.Name.includes('Nghệ An'));
      
      const pData = {
        name: ngheAn.Name,
        type: 'CITY',
        districts: ngheAn.Districts.map(d => ({
          name: d.Name,
          wards: d.Wards.map(w => w.Name)
        }))
      };
      
      fs.writeFileSync('./backend/prisma/real-locations.json', JSON.stringify([pData], null, 2));
      console.log('Successfully saved to backend/prisma/real-locations.json');
    } catch(e) {
      console.error(e);
    }
  });
}).on('error', console.error);
