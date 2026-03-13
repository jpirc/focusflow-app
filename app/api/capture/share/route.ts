import { NextRequest } from 'next/server';
import { z } from 'zod';
import {
  getAuthSession,
  successResponse,
  errorResponse,
  unauthorizedResponse,
} from '@/lib/api/route_utils';

/**
 * Share Capture API - Handles PWA share_target incoming shares
 *
 * Flow:
 *   Share Intent → App Opens → POST /api/capture/share → Return extracted content
 *
 * Auth:
 *   - Requires valid session
 *   - If not authenticated, returns 401 (client handles redirect with URL params)
 *
 * Validation:
 *   - At least one of: text, url, title must be non-empty
 *   - Content truncated to 10KB to prevent abuse
 */

// Maximum content size (10KB)
const MAX_CONTENT_LENGTH = 10 * 1024;

// Request schema
const shareSchema = z.object({
  text: z.string().optional(),
  url: z.string().optional(),
  title: z.string().optional(),
});

export type ShareCaptureRequest = z.infer<typeof shareSchema>;

export interface ShareCaptureResponse {
  content: string;
  truncated: boolean;
  source: 'text' | 'url' | 'title' | 'combined';
}

/**
 * Sanitize and combine share content
 */
function processShareContent(data: ShareCaptureRequest): {
  content: string;
  source: ShareCaptureResponse['source'];
} {
  const parts: string[] = [];
  let source: ShareCaptureResponse['source'] = 'text';

  // Add title if present
  if (data.title?.trim()) {
    parts.push(data.title.trim());
    source = 'title';
  }

  // Add text if present
  if (data.text?.trim()) {
    parts.push(data.text.trim());
    source = parts.length > 1 ? 'combined' : 'text';
  }

  // Add URL if present and not already in text
  if (data.url?.trim()) {
    const url = data.url.trim();
    // Only add URL if it's not already included in the text
    if (!data.text?.includes(url)) {
      parts.push(url);
      source = parts.length > 1 ? 'combined' : 'url';
    }
  }

  return {
    content: parts.join('\n\n'),
    source,
  };
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getAuthSession();
    if (!session?.user?.id) {
      return unauthorizedResponse();
    }

    // Parse request body
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return errorResponse('Invalid JSON', 400);
    }

    // Validate schema
    const parseResult = shareSchema.safeParse(body);
    if (!parseResult.success) {
      return errorResponse('Validation Error', 400, parseResult.error.format());
    }

    const data = parseResult.data;

    // Check that at least one field has content
    const hasContent =
      data.text?.trim() || data.url?.trim() || data.title?.trim();

    if (!hasContent) {
      return errorResponse('Nothing to capture. Please share some text or a URL.', 400);
    }

    // Process and combine content
    let { content, source } = processShareContent(data);

    // Check content length and truncate if necessary
    let truncated = false;
    if (content.length > MAX_CONTENT_LENGTH) {
      content = content.substring(0, MAX_CONTENT_LENGTH);
      truncated = true;
    }

    const response: ShareCaptureResponse = {
      content,
      truncated,
      source,
    };

    return successResponse(response);
  } catch (error) {
    console.error('[/api/capture/share] Error:', error);
    return errorResponse('Internal server error', 500);
  }
}

// Only allow POST
export async function GET() {
  return errorResponse('Method not allowed', 405);
}
