import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { lookupCouncil, getCouncilEmail } from '@/lib/mapit';
import { generateIssueEmail } from '@/lib/openai';
import { sendEmail } from '@/lib/resend';
import type { Issue, IssuePhoto } from '@/types';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const serviceClient = await createServiceClient();

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch the issue with photos
    const { data: issue, error: fetchError } = await supabase
      .from('issues')
      .select(`
        *,
        issue_photos (*)
      `)
      .eq('id', id)
      .single() as { data: Issue & { issue_photos: IssuePhoto[] } | null; error: typeof fetchError };

    if (fetchError || !issue) {
      return NextResponse.json({ error: 'Issue not found' }, { status: 404 });
    }

    // Check ownership
    if (issue.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Check if email already sent
    if (issue.status === 'email_sent') {
      return NextResponse.json(
        { error: 'Email has already been sent for this issue' },
        { status: 400 }
      );
    }

    // Look up the responsible council
    const council = await lookupCouncil(issue.latitude, issue.longitude);

    if (!council) {
      return NextResponse.json(
        { error: 'Could not determine the responsible council for this location' },
        { status: 400 }
      );
    }

    // Get council email address
    const councilEmail = getCouncilEmail(council.name);

    if (!councilEmail) {
      return NextResponse.json(
        {
          error: `Could not find contact email for ${council.name}. Please contact them directly.`,
          council: council,
        },
        { status: 400 }
      );
    }

    // Get user details for the email
    let userName: string | undefined;
    let userEmail: string | undefined;

    if (!issue.is_anonymous) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('display_name')
        .eq('id', user.id)
        .single();

      userName = profile?.display_name || user.email?.split('@')[0];
      userEmail = user.email || undefined;
    }

    // Get photo URLs
    const photoUrls = issue.issue_photos?.map((p: IssuePhoto) => p.storage_path) || [];

    // Generate email using OpenAI
    const generatedEmail = await generateIssueEmail({
      issue,
      council,
      userName,
      userEmail,
      photoUrls,
    });

    // Optionally allow editing before sending
    const body = await request.json().catch(() => ({}));
    const finalSubject = body.subject || generatedEmail.subject;
    const finalBody = body.body || generatedEmail.body;

    // Send the email
    const emailResult = await sendEmail({
      to: councilEmail,
      cc: !issue.is_anonymous ? userEmail : undefined,
      subject: finalSubject,
      body: finalBody,
      attachmentUrls: photoUrls,
    });

    if (!emailResult.success) {
      return NextResponse.json(
        { error: `Failed to send email: ${emailResult.error}` },
        { status: 500 }
      );
    }

    // Record the sent email (use service client to bypass RLS)
    await serviceClient
      .from('emails_sent')
      .insert({
        issue_id: issue.id,
        council_name: council.name,
        council_email: councilEmail,
        email_subject: finalSubject,
        email_body: finalBody,
        resend_id: emailResult.id,
      });

    // Update issue status
    await supabase
      .from('issues')
      .update({ status: 'email_sent' })
      .eq('id', id);

    return NextResponse.json({
      success: true,
      council: council.name,
      email: councilEmail,
      resend_id: emailResult.id,
    });
  } catch (error) {
    console.error('Error sending email:', error);
    return NextResponse.json(
      { error: 'Failed to send email' },
      { status: 500 }
    );
  }
}

// GET endpoint to preview the generated email
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check if OpenAI API key is configured
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key is not configured. Please set OPENAI_API_KEY in your .env.local file.' },
        { status: 500 }
      );
    }

    const { id } = await params;
    const supabase = await createClient();

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch the issue
    const { data: issue, error: fetchError } = await supabase
      .from('issues')
      .select(`
        *,
        issue_photos (*)
      `)
      .eq('id', id)
      .single() as { data: Issue & { issue_photos: IssuePhoto[] } | null; error: typeof fetchError };

    if (fetchError || !issue) {
      return NextResponse.json({ error: 'Issue not found' }, { status: 404 });
    }

    // Check ownership
    if (issue.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Look up the responsible council
    console.log('Looking up council for:', issue.latitude, issue.longitude);
    const council = await lookupCouncil(issue.latitude, issue.longitude);
    console.log('Council lookup result:', council);

    if (!council) {
      return NextResponse.json(
        { error: `Could not determine the responsible council for location (${issue.latitude}, ${issue.longitude}). The location may be outside the UK.` },
        { status: 400 }
      );
    }

    const councilEmail = getCouncilEmail(council.name);

    // Get user details
    let userName: string | undefined;
    let userEmail: string | undefined;

    if (!issue.is_anonymous) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('display_name')
        .eq('id', user.id)
        .single();

      userName = profile?.display_name || user.email?.split('@')[0];
      userEmail = user.email || undefined;
    }

    // Get photo URLs
    const photoUrls = issue.issue_photos?.map((p: IssuePhoto) => p.storage_path) || [];

    // Generate preview email
    console.log('Generating email with OpenAI...');
    const generatedEmail = await generateIssueEmail({
      issue,
      council,
      userName,
      userEmail,
      photoUrls,
    });
    console.log('Email generated successfully');

    return NextResponse.json({
      council: council.name,
      councilEmail: councilEmail || 'Email not found - manual lookup required',
      subject: generatedEmail.subject,
      body: generatedEmail.body,
      canSend: !!councilEmail,
    });
  } catch (error) {
    console.error('Error generating preview:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: `Failed to generate email preview: ${errorMessage}` },
      { status: 500 }
    );
  }
}
