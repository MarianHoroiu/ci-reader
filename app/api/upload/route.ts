import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/webp',
      'application/pdf',
    ];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Invalid file type' }, { status: 400 });
    }

    // Validate file size (10MB limit)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json({ error: 'File too large' }, { status: 400 });
    }

    // Simulate processing time based on file size
    const processingTime = Math.min((file.size / (1024 * 1024)) * 1000, 5000); // Max 5 seconds
    await new Promise(resolve => setTimeout(resolve, processingTime));

    // Mock successful response
    return NextResponse.json({
      success: true,
      data: {
        id: `upload_${Date.now()}`,
        filename: file.name,
        size: file.size,
        type: file.type,
        url: `/uploads/${file.name}`, // Mock URL
        uploadedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
