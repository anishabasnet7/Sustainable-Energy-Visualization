const fs = require("fs");
const path = require("path");

// jupyter processed CSV
const sourcePath = path.resolve(__dirname, "../../data/processed_data.csv");

// react public folder
const destPath = path.resolve(__dirname, "../public/processed_data.csv");

console.log("Copying processed_data.csv from python's to react folder");

fs.copyFile(sourcePath, destPath, (err) => {
  if (err) {
    console.error("Error copying file:", err);
  } else {
    console.log(`CSV copied successfully!`);
    console.log(`Source: ${sourcePath}`);
    console.log(`Destination: ${destPath}`);
  }
});
