#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🧪 PWA Manifest Validation Test\n');

// Test 1: Check if manifest.json exists and is valid JSON
try {
  const manifestPath = path.join(__dirname, 'public', 'manifest.json');
  const manifestContent = fs.readFileSync(manifestPath, 'utf8');
  const manifest = JSON.parse(manifestContent);

  console.log('✅ Manifest file exists and is valid JSON');

  // Test 2: Check required fields
  const requiredFields = [
    'name',
    'short_name',
    'start_url',
    'display',
    'theme_color',
    'icons',
  ];
  const missingFields = requiredFields.filter(field => !manifest[field]);

  if (missingFields.length === 0) {
    console.log('✅ All required manifest fields are present');
  } else {
    console.log('❌ Missing required fields:', missingFields.join(', '));
  }

  // Test 3: Check icons
  if (manifest.icons && manifest.icons.length > 0) {
    console.log(`✅ Manifest contains ${manifest.icons.length} icons`);

    // Check if icon files exist
    let iconCount = 0;
    manifest.icons.forEach(icon => {
      const iconPath = path.join(__dirname, 'public', icon.src);
      if (fs.existsSync(iconPath)) {
        iconCount++;
      }
    });

    if (iconCount === manifest.icons.length) {
      console.log('✅ All icon files exist');
    } else {
      console.log(`⚠️  ${iconCount}/${manifest.icons.length} icon files exist`);
    }
  } else {
    console.log('❌ No icons defined in manifest');
  }

  // Test 4: Check apple-touch-icon
  const appleTouchIconPath = path.join(
    __dirname,
    'public',
    'apple-touch-icon.png'
  );
  if (fs.existsSync(appleTouchIconPath)) {
    console.log('✅ Apple touch icon exists');
  } else {
    console.log('❌ Apple touch icon missing');
  }

  // Test 5: Display manifest summary
  console.log('\n📱 Manifest Summary:');
  console.log(`   Name: ${manifest.name}`);
  console.log(`   Short Name: ${manifest.short_name}`);
  console.log(`   Display: ${manifest.display}`);
  console.log(`   Theme Color: ${manifest.theme_color}`);
  console.log(`   Background Color: ${manifest.background_color}`);
  console.log(`   Start URL: ${manifest.start_url}`);
  console.log(`   Icons: ${manifest.icons?.length || 0} defined`);

  console.log('\n🎉 PWA Manifest validation completed!');
} catch (error) {
  console.log('❌ Error reading or parsing manifest:', error.message);
}
