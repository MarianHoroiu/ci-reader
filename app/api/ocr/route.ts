/**
 * OCR API Route for Server-Side Processing
 * Uses Tesseract.js with external packages configuration
 * Solution 2: Next.js External Packages approach
 */

import { NextRequest, NextResponse } from 'next/server';
import { createWorker, PSM, OEM } from 'tesseract.js';

export async function POST(request: NextRequest) {
  try {
    const { imageData, language = 'ron' } = await request.json();

    if (!imageData) {
      return NextResponse.json(
        { error: 'No image data provided' },
        { status: 400 }
      );
    }

    // Create Tesseract worker with paths pointing to our public assets
    // Use relative paths to avoid SSL/protocol issues
    const worker = await createWorker(language, 1, {
      // Use relative paths from public folder
      langPath: '/workers/tesseract/',
      // Disable gzip since we have uncompressed files
      gzip: false,
      logger: m => {
        console.log(
          `OCR Progress: ${m.status} - ${(m.progress * 100).toFixed(1)}%`
        );
      },
    });

    // Set enhanced parameters for better Romanian ID recognition
    await worker.setParameters({
      tessedit_pageseg_mode: PSM.AUTO, // Auto page segmentation for better layout detection
      tessedit_ocr_engine_mode: OEM.LSTM_ONLY, // LSTM only for better accuracy
      tessedit_char_whitelist:
        'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyzĂÂÎȘȚăâîșț0123456789.,- /:',
      textord_min_linesize: '2.0', // Better line detection for small text
      preserve_interword_spaces: '1', // Preserve spaces between words
      // Additional parameters for better Romanian ID processing
      textord_tabfind_find_tables: '0', // Disable table detection
      textord_use_cjk_fp_model: '0', // Disable CJK model
      load_system_dawg: '0', // Disable system dictionary
      load_freq_dawg: '0', // Disable frequency dictionary
      load_unambig_dawg: '0', // Disable unambiguous dictionary
      load_punc_dawg: '0', // Disable punctuation dictionary
      load_number_dawg: '0', // Disable number dictionary
      load_bigram_dawg: '0', // Disable bigram dictionary
      wordrec_enable_assoc: '0', // Disable word association
      // Improve character recognition
      classify_enable_learning: '0', // Disable adaptive learning
      classify_enable_adaptive_matcher: '0', // Disable adaptive matching
      // Better handling of Romanian diacritics
      textord_really_old_xheight: '1',
      textord_old_xheight: '1',
    });

    const startTime = Date.now();

    // Add debugging information
    console.log('Image data type:', typeof imageData);
    console.log('Image data length:', imageData.length);
    console.log('Image data prefix:', imageData.substring(0, 50));

    // Check if it's a PDF file
    if (imageData.startsWith('data:application/pdf')) {
      throw new Error(
        'PDF files are not supported for direct OCR processing. Please convert to PNG/JPEG first or use a PDF-to-image conversion service.'
      );
    }

    // Process the image with basic configuration
    const result = await worker.recognize(imageData);

    console.log('OCR Result - Text length:', result.data.text.length);
    console.log('OCR Result - Confidence:', result.data.confidence);
    console.log('OCR Result - Words found:', result.data.words?.length || 0);
    console.log(
      'OCR Result - Text preview:',
      result.data.text.substring(0, 100)
    );

    // Terminate the worker
    await worker.terminate();

    const processingTime = Date.now() - startTime;

    // Build OCR result
    const ocrResult = {
      text: result.data.text,
      confidence: result.data.confidence,
      words: result.data.words || [],
      lines: result.data.lines || [],
      paragraphs: result.data.paragraphs || [],
      blocks: result.data.blocks || [],
      bbox: result.data.box || { x0: 0, y0: 0, x1: 0, y1: 0 },
      processingTime,
      language,
    };

    return NextResponse.json({
      success: true,
      result: ocrResult,
    });
  } catch (error) {
    console.error('OCR processing failed:', error);

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'OCR_PROCESSING_FAILED',
          message: error instanceof Error ? error.message : 'Unknown error',
          details: error instanceof Error ? error.stack : String(error),
        },
      },
      { status: 500 }
    );
  }
}
