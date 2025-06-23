import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    const { folderPath } = await request.json();

    if (!folderPath) {
      return NextResponse.json(
        { error: 'Folder path is required' },
        { status: 400 }
      );
    }

    // Resolve and validate the folder path
    const resolvedPath = path.resolve(folderPath);

    // Check if folder exists
    if (!fs.existsSync(resolvedPath)) {
      return NextResponse.json({ error: 'Folder not found' }, { status: 404 });
    }

    // Check if it's actually a directory
    const stats = fs.statSync(resolvedPath);
    if (!stats.isDirectory()) {
      return NextResponse.json(
        { error: 'Path is not a directory' },
        { status: 400 }
      );
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

    // Execute the command to open the folder with default file manager
    return new Promise(resolve => {
      exec(command, (error, _stdout, _stderr) => {
        if (error) {
          console.error('Error opening folder:', error);
          resolve(
            NextResponse.json(
              { error: `Failed to open folder: ${error.message}` },
              { status: 500 }
            )
          );
        } else {
          resolve(
            NextResponse.json(
              { success: true, message: 'Folder opened successfully' },
              { status: 200 }
            )
          );
        }
      });
    });
  } catch (error) {
    console.error('Error opening folder:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
