import { NextRequest, NextResponse } from 'next/server';
import createReport from 'docx-templates';
import fs from 'fs';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    const { personData, templatePath } = await request.json();

    // Validate inputs
    if (!personData || !templatePath) {
      return NextResponse.json(
        { error: 'Person data and template path are required' },
        { status: 400 }
      );
    }

    // Check if template file exists
    if (!fs.existsSync(templatePath)) {
      return NextResponse.json(
        { error: 'Template file not found' },
        { status: 404 }
      );
    }

    // Read the template file
    const template = fs.readFileSync(templatePath);

    // Process the document with person data
    const buffer = await createReport({
      template,
      data: personData,
      cmdDelimiter: ['{', '}'], // Use {} delimiters for better Word compatibility
      failFast: false, // Collect all errors for better debugging
      fixSmartQuotes: true, // Handle Word's smart quotes
    });

    // Generate output paths and filename
    const templateName = path.basename(templatePath, '.docx');
    const personName =
      `${personData.nume || 'Unknown'}_${personData.prenume || ''}`.replace(
        /\s+/g,
        '_'
      );
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const timestamp = `${year}.${month}.${day}_${hours}.${minutes}`;
    const outputFilename = `${personName}_${timestamp}.docx`;

    // Create output directory path
    const documentsPath = '/Users/mario/Desktop/CI-Reader/Documents';
    const outputDir = path.join(documentsPath, templateName);
    const outputPath = path.join(outputDir, outputFilename);

    // Create directory if it doesn't exist
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Save the file
    fs.writeFileSync(outputPath, Buffer.from(buffer));

    // Return success response
    return NextResponse.json({
      success: true,
      message: 'Document saved successfully',
      filename: outputFilename,
      path: outputPath,
    });
  } catch (error: any) {
    console.error('Error processing document:', error);

    // Handle template errors specifically
    if (Array.isArray(error)) {
      return NextResponse.json(
        {
          error: 'Template processing errors',
          details: error.map(err => err.message),
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to process document', details: error.message },
      { status: 500 }
    );
  }
}
