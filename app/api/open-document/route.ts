import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    const { filePath } = await request.json();

    if (!filePath) {
      return NextResponse.json(
        { error: 'File path is required' },
        { status: 400 }
      );
    }

    // Resolve and validate the file path
    const resolvedPath = path.resolve(filePath);

    // Check if file exists
    if (!fs.existsSync(resolvedPath)) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    // Determine the command based on the operating system
    let command: string;
    const platform = process.platform;

    switch (platform) {
      case 'darwin': // macOS
        command = `open "${resolvedPath}"`;
        break;
      case 'win32': // Windows
        command = `start "" "${resolvedPath}"`;
        break;
      case 'linux': // Linux
        command = `xdg-open "${resolvedPath}"`;
        break;
      default:
        return NextResponse.json(
          { error: `Unsupported platform: ${platform}` },
          { status: 400 }
        );
    }

    // Execute the command to open the file with default application
    return new Promise(resolve => {
      exec(command, (error, _stdout, _stderr) => {
        if (error) {
          console.error('Error opening file:', error);
          resolve(
            NextResponse.json(
              { error: `Failed to open file: ${error.message}` },
              { status: 500 }
            )
          );
        } else {
          resolve(
            NextResponse.json(
              { success: true, message: 'File opened successfully' },
              { status: 200 }
            )
          );
        }
      });
    });
  } catch (error) {
    console.error('Error opening document:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
