const axios = require("axios");
const fs = require("fs");
const path = require("path");

const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
};

const keysFilePath = path.join(__dirname, "keys.txt");
const keys = fs
  .readFileSync(keysFilePath, "utf-8")
  .split("\n")
  .map((line) => line.trim())
  .filter(Boolean);
const keyState = keys.reduce((acc, key) => {
  acc[key] = { isChangingIP: false };
  return acc;
}, {});

async function changeKeyIP(key) {
  if (keyState[key].isChangingIP) return;

  keyState[key].isChangingIP = true;
  console.log(`Attempting to change IP for key: ${key}`);
  try {
    const response = await axios.get(
      `https://app.proxyno1.com/api/change-key-ip/${key}`
    );
    const data = response.data;

    if (data.status === 0) {
      console.log(
        `Key ${colors.yellow}${key}${colors.reset} changed successfully: ${colors.green}`,
        data.message + colors.reset
      );
      keyState[key].isChangingIP = false;
      changeKeyIP(key);
    } else if (data.status === 5) {
      const waitTime = parseInt(data.message.match(/\d+/)[0], 10);
      console.log(
        `Key ${colors.yellow}${key}${colors.reset}: Please wait ${waitTime} seconds for the next IP change.`
      );

      // Start countdown timer
      let remainingTime = waitTime;
      const countdown = setInterval(() => {
        if (remainingTime > 0) {
          console.log(
            `Key ${colors.yellow}${key}${colors.reset}: Time remaining: ${colors.red}${remainingTime}${colors.reset} seconds`
          );
          remainingTime -= 1;
        } else {
          clearInterval(countdown);
          console.log(`Retrying to change IP for key: ${colors.yellow}${key}${colors.reset}`);
          keyState[key].isChangingIP = false;
          changeKeyIP(key);
        }
      }, 1000);
    } else {
      console.log(`Unexpected response for key ${colors.yellow}${key}${colors.reset}:`, data);
      keyState[key].isChangingIP = false;
    }
  } catch (error) {
    console.error(`Error fetching data for key ${colors.yellow}${key}${colors.reset}:`, error);
    keyState[key].isChangingIP = false;
  }
}

function startChangingIPs(keys) {
  keys.forEach((key) => {
    changeKeyIP(key);
  });
}

startChangingIPs(keys);
