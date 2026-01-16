import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // Fetch the issue with photos and emails
    const { data: issue, error } = await supabase
      .from('issues')
      .select(`
        *,
        issue_photos (*),
        emails_sent (*)
      `)
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Issue not found' }, { status: 404 });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Fetch the user's display name separately if not anonymous
    let displayName = null;
    if (issue.user_id && !issue.is_anonymous) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('display_name')
        .eq('id', issue.user_id)
        .single();
      displayName = profile?.display_name;
    }

    return NextResponse.json({
      issue: {
        ...issue,
        profiles: displayName ? { display_name: displayName } : null
      }
    });
  } catch (error) {
    console.error('Error fetching issue:', error);
    return NextResponse.json({ error: 'Failed to fetch issue' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check ownership
    const { data: existingIssue, error: fetchError } = await supabase
      .from('issues')
      .select('user_id')
      .eq('id', id)
      .single();

    if (fetchError) {
      return NextResponse.json({ error: 'Issue not found' }, { status: 404 });
    }

    if (existingIssue.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const allowedFields = ['title', 'description', 'issue_type', 'latitude', 'longitude', 'grid_reference', 'is_anonymous', 'status'];
    const updateData: Record<string, unknown> = {};

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    }

    const { data: issue, error: updateError } = await supabase
      .from('issues')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ issue });
  } catch (error) {
    console.error('Error updating issue:', error);
    return NextResponse.json({ error: 'Failed to update issue' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check ownership and status (can only delete drafts)
    const { data: existingIssue, error: fetchError } = await supabase
      .from('issues')
      .select('user_id, status')
      .eq('id', id)
      .single();

    if (fetchError) {
      return NextResponse.json({ error: 'Issue not found' }, { status: 404 });
    }

    if (existingIssue.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (existingIssue.status !== 'draft') {
      return NextResponse.json(
        { error: 'Can only delete draft issues' },
        { status: 400 }
      );
    }

    const { error: deleteError } = await supabase
      .from('issues')
      .delete()
      .eq('id', id);

    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting issue:', error);
    return NextResponse.json({ error: 'Failed to delete issue' }, { status: 500 });
  }
}
