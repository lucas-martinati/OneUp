import { chromium } from 'playwright';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.join(__dirname, '..');
const outDir = path.join(projectRoot, 'android', 'app', 'src', 'main', 'res', 'drawable-nodpi');

async function captureWidget(htmlFile, outputName, width, height) {
  const browser = await chromium.launch();
  const page = await browser.newPage({
    viewport: { width, height },
    deviceScaleFactor: 2, // 2x for crisp rendering
  });

  const filePath = path.join(projectRoot, 'android', htmlFile);
  await page.goto(`file://${filePath}`);
  await page.waitForTimeout(500);

  await page.screenshot({
    path: path.join(outDir, `${outputName}.png`),
    omitBackground: true, // transparent background
  });

  await browser.close();
  console.log(`✅ Captured ${outputName}.png (${width * 2}x${height * 2}px @2x)`);
}

async function main() {
  const fs = await import('fs');
  fs.mkdirSync(outDir, { recursive: true });

  await captureWidget('widget_preview_small.html', 'widget_preview_small', 220, 100);
  await captureWidget('widget_preview_large.html', 'widget_preview_large', 400, 180);

  console.log('✨ All widget previews generated!');
}

main().catch(console.error);
