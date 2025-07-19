const { exec } = require('child_process');
const os = require('os');

/**
 * Fungsi untuk membuka URL di browser default secara otomatis
 * @param {string} url - URL yang akan dibuka
 * @returns {Promise<boolean>} - Promise yang resolve ke true jika berhasil
 */
async function openBrowser(url) {
  return new Promise((resolve) => {
    // Skip jika tidak ada URL
    if (!url) {
      console.log('Tidak ada URL untuk dibuka');
      resolve(false);
      return;
    }

    console.log(`Membuka browser otomatis: ${url}`);
    
    const platform = os.platform();
    let command;

    switch (platform) {
      case 'win32': // Windows
        command = `start "" "${url}"`;
        break;
      case 'darwin': // macOS
        command = `open "${url}"`;
        break;
      default: // Linux dan lainnya
        command = `xdg-open "${url}"`;
    }

    exec(command, (error) => {
      if (error) {
        console.error('Error membuka browser:', error);
        resolve(false);
      } else {
        console.log('Browser berhasil dibuka!');
        resolve(true);
      }
    });
  });
}

module.exports = openBrowser;
