import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const TEMPLATES_PATH = '/Users/mario/Desktop/CI-Reader/Documents/Templates';

export async function GET() {
  try {
    // Check if directory exists
    if (!fs.existsSync(TEMPLATES_PATH)) {
      return NextResponse.json({ templates: [] });
    }

    // Read directory contents
    const files = fs.readdirSync(TEMPLATES_PATH);

    // Filter for .docx files and get file stats
    const templates = files
      .filter(file => file.toLowerCase().endsWith('.docx'))
      .map(file => {
        const filePath = path.join(TEMPLATES_PATH, file);
        const stats = fs.statSync(filePath);

        return {
          id: file,
          name: file,
          path: filePath,
          lastModified: stats.mtime.toISOString().split('T')[0],
        };
      })
      .sort((a, b) => a.name.localeCompare(b.name));

    return NextResponse.json({ templates });
  } catch (error) {
    console.error('Error reading templates directory:', error);
    return NextResponse.json({ templates: [] });
  }
}
