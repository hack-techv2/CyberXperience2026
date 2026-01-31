import { NextRequest, NextResponse } from 'next/server';

const WEB_TRAVERSAL_URL = process.env.WEB_TRAVERSAL_URL || 'http://web-traversal:5000';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path } = await params;
    const filename = path.join('/');

    const response = await fetch(`${WEB_TRAVERSAL_URL}/api/files/${filename}`, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Error proxying to web-traversal:', error);
    return NextResponse.json(
      { status: 'error', message: 'Failed to connect to backend service' },
      { status: 502 }
    );
  }
}
