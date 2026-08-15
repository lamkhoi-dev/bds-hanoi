const xlsx = require('xlsx');
const path = require('path');

const filePath = process.argv[2];
const workbook = xlsx.readFile(filePath);
const sheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[sheetName];
const data = xlsx.utils.sheet_to_json(worksheet);

console.log('Total rows:', data.length);
if (data.length > 0) {
  console.log('Headers:', Object.keys(data[0]));
  console.log('First row:', data[0]);
}
