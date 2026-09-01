const fs = require('fs');
const path = require('path');
const https = require('https');
const sharp = require('sharp');

const baseUrl = 'https://raw.githubusercontent.com/FluffyStuff/riichi-mahjong-tiles/master/Export/Regular/';
const rawDir = path.resolve(__dirname, 'raw_png');
const outputDir = path.resolve(__dirname, '../../public/tiles');

const tileFiles = [
  // 萬子
  'Man1.png', 'Man2.png', 'Man3.png', 'Man4.png', 'Man5.png', 'Man5-Dora.png', 'Man6.png', 'Man7.png', 'Man8.png', 'Man9.png',
  // 筒子
  'Pin1.png', 'Pin2.png', 'Pin3.png', 'Pin4.png', 'Pin5.png', 'Pin5-Dora.png', 'Pin6.png', 'Pin7.png', 'Pin8.png', 'Pin9.png',
  // 索子
  'Sou1.png', 'Sou2.png', 'Sou3.png', 'Sou4.png', 'Sou5.png', 'Sou5-Dora.png', 'Sou6.png', 'Sou7.png', 'Sou8.png', 'Sou9.png',
  // 字牌
  'Ton.png', 'Nan.png', 'Shaa.png', 'Pei.png', 'Haku.png', 'Hatsu.png', 'Chun.png',
  // ベース
  'Front.png', 'Back.png', 'Blank.png'
];

if (!fs.existsSync(rawDir)) {
  fs.mkdirSync(rawDir, { recursive: true });
}
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

function downloadFile(file) {
  return new Promise((resolve, reject) => {
    const url = baseUrl + file;
    const dest = path.join(rawDir, file);
    if (fs.existsSync(dest)) {
      resolve();
      return;
    }
    const fileStream = fs.createWriteStream(dest);

    https.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download ${file}: Status ${response.statusCode}`));
        return;
      }
      response.pipe(fileStream);
      fileStream.on('finish', () => {
        fileStream.close();
        console.log(`Downloaded: ${file}`);
        resolve();
      });
    }).on('error', (err) => {
      fs.unlink(dest, () => {});
      reject(err);
    });
  });
}

async function main() {
  console.log(`Downloading raw PNGs...`);
  for (const file of tileFiles) {
    await downloadFile(file);
  }
  console.log('All raw PNGs downloaded.');

  const frontPath = path.join(rawDir, 'Front.png');
  const targetWidth = 150;
  const targetHeight = 200;

  // Front（白牌ベース）をリサイズ
  const frontBuffer = await sharp(frontPath)
    .resize(targetWidth, targetHeight, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();

  // Back（裏面）をリサイズして保存
  const backPath = path.join(rawDir, 'Back.png');
  await sharp(backPath)
    .resize(targetWidth, targetHeight, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toFile(path.join(outputDir, 'Back.png'));
  console.log('Processed Back.png');

  // Blank（白牌）をリサイズして保存
  await sharp(frontPath)
    .resize(targetWidth, targetHeight, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toFile(path.join(outputDir, 'Blank.png'));
  console.log('Processed Blank.png');

  // Front.png 自体も保存
  await sharp(frontPath)
    .resize(targetWidth, targetHeight, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toFile(path.join(outputDir, 'Front.png'));

  // 各絵柄を Front の上に合成
  for (const file of tileFiles) {
    if (file === 'Front.png' || file === 'Back.png' || file === 'Blank.png') continue;

    const overlayPath = path.join(rawDir, file);
    const overlayBuffer = await sharp(overlayPath)
      .resize(targetWidth, targetHeight, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toBuffer();

    const finalImage = await sharp(frontBuffer)
      .composite([{ input: overlayBuffer, blend: 'over' }])
      .png({ quality: 90, compressionLevel: 9 })
      .toFile(path.join(outputDir, file));

    console.log(`Composed tile: ${file}`);
  }

  console.log('All composite tiles generated successfully!');
}

main().catch(err => {
  console.error('Error generating tiles:', err);
  process.exit(1);
});
