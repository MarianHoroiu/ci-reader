# OCR Troubleshooting Guide: "No Text Extracted"

## 🔍 Common Causes & Solutions

Based on [Tesseract OCR documentation](https://tesseract-ocr.github.io/tessdoc/ImproveQuality.html)
and [GitHub issues](https://github.com/tesseract-ocr/tesseract/issues/4371), here are the most
common reasons for "No text extracted":

## 1. Image Quality Issues

### Problem: Poor Image Quality

**Symptoms:** Low confidence scores, empty results, garbled text

**Solutions:**

- **Resolution:** Ensure image is at least 300 DPI
- **Contrast:** High contrast between text and background
- **Noise:** Remove noise and artifacts
- **Orientation:** Ensure text is properly oriented (not rotated)

### Image Preprocessing Recommendations:

```javascript
// Add to worker configuration
const worker = await createWorker(language, 1, {
  langPath: `${baseUrl}/workers/tesseract/`,
  gzip: false,
  // Image preprocessing options
  tessedit_pageseg_mode: '6', // Single uniform block of text
  tessedit_ocr_engine_mode: '1', // LSTM only
  logger: m => console.log(`OCR Progress: ${m.status} - ${(m.progress * 100).toFixed(1)}%`),
});
```

## 2. Page Segmentation Mode Issues

### Problem: Wrong Page Segmentation

**Symptoms:** Text detected but not recognized correctly

**Page Segmentation Modes:**

- `0` - Orientation and script detection (OSD) only
- `1` - Automatic page segmentation with OSD
- `3` - Fully automatic page segmentation (default)
- `6` - Assume a single uniform block of text
- `7` - Treat the image as a single text line
- `8` - Treat the image as a single word
- `13` - Raw line. Treat the image as a single text line, bypassing hacks

**For Romanian ID cards, try mode `6` or `7`**

## 3. Language Data Issues

### Problem: Wrong Language or Missing Data

**Current Status:** ✅ Romanian (`ron`) language data is loading correctly

**Verification:**

```bash
# Check if language data is accessible
curl http://localhost:3001/workers/tesseract/ron.traineddata -I
# Should return 200 OK
```

## 4. Character Recognition Issues

### Problem: Special Romanian Characters

**Romanian specific characters:** `Ă Â Î Ș Ț ă â î ș ț`

**Solution:** Use character whitelist in worker setup:

```javascript
await worker.setParameters({
  tessedit_char_whitelist:
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyzĂÂÎȘȚăâîșț0123456789.,- ',
});
```

## 5. Image Format Issues

### Problem: Unsupported or Corrupted Image Data

**Check image data format:**

- Should be base64 data URL: `data:image/jpeg;base64,/9j/4AAQ...`
- Supported formats: JPEG, PNG, TIFF, BMP
- File size should be reasonable (< 10MB)

## 🧪 Debugging Steps

### Step 1: Check Server Logs

Look for these debug messages in terminal:

```
Image data type: string
Image data length: [should be > 1000]
Image data prefix: data:image/jpeg;base64,/9j/4AAQ...
OCR Result - Text length: [should be > 0]
OCR Result - Confidence: [should be > 30]
```

### Step 2: Test with Simple Image

Create a test image with clear, large text:

```javascript
// Test with a simple text image
const testImage =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==';
```

### Step 3: Verify Romanian ID Format

Romanian ID cards typically have:

- **Text orientation:** Horizontal
- **Font:** Sans-serif, medium size
- **Background:** Light colored
- **Text color:** Dark (black/blue)

## 🔧 Advanced Solutions

### Solution 1: Enhanced Worker Configuration

```javascript
// Update app/api/ocr/route.ts
const worker = await createWorker(language, 1, {
  langPath: `${baseUrl}/workers/tesseract/`,
  gzip: false,
  logger: m => console.log(`OCR Progress: ${m.status} - ${(m.progress * 100).toFixed(1)}%`),
});

// Set additional parameters
await worker.setParameters({
  tessedit_pageseg_mode: '6',
  tessedit_ocr_engine_mode: '1',
  tessedit_char_whitelist:
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyzĂÂÎȘȚăâîșț0123456789.,- ',
  textord_min_linesize: '2.5',
});
```

### Solution 2: Image Preprocessing

Add client-side image preprocessing before sending to server:

```javascript
// In useServerOCR.ts - preprocess image
const preprocessImage = canvas => {
  const ctx = canvas.getContext('2d');
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

  // Convert to grayscale and enhance contrast
  for (let i = 0; i < imageData.data.length; i += 4) {
    const gray =
      imageData.data[i] * 0.299 + imageData.data[i + 1] * 0.587 + imageData.data[i + 2] * 0.114;
    imageData.data[i] = gray;
    imageData.data[i + 1] = gray;
    imageData.data[i + 2] = gray;
  }

  ctx.putImageData(imageData, 0, 0);
  return canvas.toDataURL('image/png');
};
```

### Solution 3: Multiple OCR Attempts

Try different configurations if first attempt fails:

```javascript
const ocrConfigs = [
  { tessedit_pageseg_mode: '6' }, // Single block
  { tessedit_pageseg_mode: '7' }, // Single line
  { tessedit_pageseg_mode: '8' }, // Single word
  { tessedit_pageseg_mode: '3' }, // Auto segmentation
];

for (const config of ocrConfigs) {
  await worker.setParameters(config);
  const result = await worker.recognize(imageData);
  if (result.data.text.trim().length > 0) {
    return result; // Success!
  }
}
```

## 📊 Expected Results

### Good OCR Results:

- **Confidence:** > 70%
- **Text length:** > 10 characters
- **Words detected:** > 3
- **Recognizable Romanian text patterns**

### Poor OCR Results:

- **Confidence:** < 30%
- **Text length:** 0 or very short
- **Words detected:** 0-1
- **Garbled or empty output**

## 🎯 Next Steps

1. **Upload a Romanian ID image** and check server logs for debug output
2. **Check image quality** - ensure it's clear, well-lit, and properly oriented
3. **Try different page segmentation modes** if default doesn't work
4. **Consider image preprocessing** if text is still not detected

## 📚 References

- [Tesseract OCR Quality Improvement](https://tesseract-ocr.github.io/tessdoc/ImproveQuality.html)
- [Tesseract GitHub Issues](https://github.com/tesseract-ocr/tesseract/issues/4371)
- [Page Segmentation Modes](https://tesseract-ocr.github.io/tessdoc/ImproveQuality.html#page-segmentation-method)
- [Romanian Language Support](https://github.com/tesseract-ocr/tesseract)

The key insight from the Tesseract documentation is that **OCR engines will always try to find text
even when none exists**, so the issue is likely image quality or configuration rather than missing
training data.
