import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);

    const status = searchParams.get('status');
    const userId = searchParams.get('user_id');

    let query = supabase
      .from('issues')
      .select(`
        *,
        issue_photos (*),
        emails_sent (*)
      `)
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    if (userId) {
      query = query.eq('user_id', userId);
    } else {
      // Only show non-draft issues to public
      query = query.neq('status', 'draft');
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ issues: data });
  } catch (error) {
    console.error('Error fetching issues:', error);
    return NextResponse.json({ error: 'Failed to fetch issues' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      title,
      description,
      issue_type,
      latitude,
      longitude,
      grid_reference,
      is_anonymous,
      photos,
    } = body;

    // Validate required fields
    if (!title || !description || !latitude || !longitude) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create the issue
    const { data: issue, error: issueError } = await supabase
      .from('issues')
      .insert({
        user_id: user.id,
        title,
        description,
        issue_type: issue_type || 'other',
        latitude,
        longitude,
        grid_reference,
        is_anonymous: is_anonymous || false,
        status: 'submitted',
      })
      .select()
      .single();

    if (issueError) {
      console.error('Error creating issue:', issueError);
      return NextResponse.json({ error: issueError.message }, { status: 500 });
    }

    // Add photos if provided
    if (photos && photos.length > 0) {
      const photoRecords = photos.map((url: string) => ({
        issue_id: issue.id,
        storage_path: url,
      }));

      const { error: photosError } = await supabase
        .from('issue_photos')
        .insert(photoRecords);

      if (photosError) {
        console.error('Error adding photos:', photosError);
        // Don't fail the whole request if photos fail
      }
    }

    return NextResponse.json({ issue }, { status: 201 });
  } catch (error) {
    console.error('Error creating issue:', error);
    return NextResponse.json({ error: 'Failed to create issue' }, { status: 500 });
  }
}
