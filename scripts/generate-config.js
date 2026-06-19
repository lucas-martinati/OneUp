import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// ESM equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const GOOGLE_CLIENT_ID = process.env.VITE_GOOGLE_CLIENT_ID;

if (!GOOGLE_CLIENT_ID) {
  console.error('❌ Error: VITE_GOOGLE_CLIENT_ID not found in .env file');
  console.error('Please add VITE_GOOGLE_CLIENT_ID to your .env file');
  process.exit(1);
}

console.log('🔧 Generating configuration files from templates...');

try {
  // Generate capacitor.config.json
  const capacitorTemplatePath = path.join(__dirname, '..', 'config', 'capacitor.config.template.json');
  const capacitorTemplate = fs.readFileSync(capacitorTemplatePath, 'utf8');
  const capacitorConfig = capacitorTemplate.replace(/__GOOGLE_CLIENT_ID__/g, GOOGLE_CLIENT_ID);
  const capacitorConfigPath = path.join(__dirname, '..', 'capacitor.config.json');
  fs.writeFileSync(capacitorConfigPath, capacitorConfig);
  console.log('✅ Generated capacitor.config.json');

  // Generate Android strings.xml
  const stringsTemplatePath = path.join(
    __dirname,
    '..',
    'android',
    'strings.template.xml'
  );
  const stringsTemplate = fs.readFileSync(stringsTemplatePath, 'utf8');
  const stringsXml = stringsTemplate.replace(/__GOOGLE_CLIENT_ID__/g, GOOGLE_CLIENT_ID);
  const stringsXmlPath = path.join(
    __dirname,
    '..',
    'android',
    'app',
    'src',
    'main',
    'res',
    'values',
    'strings.xml'
  );
  fs.writeFileSync(stringsXmlPath, stringsXml);
  console.log('✅ Generated android/app/src/main/res/values/strings.xml');

  console.log('✨ All configuration files generated successfully!');
} catch (error) {
  console.error('❌ Error generating configuration files:', error.message);
  process.exit(1);
}
