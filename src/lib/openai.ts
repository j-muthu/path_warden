import OpenAI from 'openai';
import type { Issue, CouncilInfo } from '@/types';
import { ISSUE_TYPE_LABELS } from '@/types';

function getOpenAIClient(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY environment variable is not set');
  }
  return new OpenAI({ apiKey });
}

interface GenerateEmailParams {
  issue: Issue;
  council: CouncilInfo;
  userName?: string;
  userEmail?: string;
  photoUrls?: string[];
}

interface GeneratedEmail {
  subject: string;
  body: string;
}

export async function generateIssueEmail(params: GenerateEmailParams): Promise<GeneratedEmail> {
  const { issue, council, userName, userEmail, photoUrls } = params;

  const issueTypeLabel = ISSUE_TYPE_LABELS[issue.issue_type];
  const locationInfo = issue.grid_reference
    ? `Grid Reference: ${issue.grid_reference} (Latitude: ${issue.latitude}, Longitude: ${issue.longitude})`
    : `Latitude: ${issue.latitude}, Longitude: ${issue.longitude}`;

  const userInfo = issue.is_anonymous
    ? 'This report has been submitted anonymously through the Path Warden app.'
    : `This report has been submitted by ${userName || 'a user'} (${userEmail || 'email not provided'}) through the Path Warden app.`;

  const userSignature = issue.is_anonymous
    ? ''
    : ` on behalf of ${userName || 'a user'} (${userEmail || 'email not provided'})`;

  const photoInfo = photoUrls && photoUrls.length > 0
    ? `\n\n${photoUrls.length} photo(s) are attached to this report showing the issue.`
    : '';

  const prompt = `You are writing a formal email to a UK local authority about a public rights of way issue. The email should be professional, clear, and reference relevant legislation (Highways Act 1980).

Write an email with the following details:

ISSUE TYPE: ${issueTypeLabel}
ISSUE TITLE: ${issue.title}
ISSUE DESCRIPTION: ${issue.description}
LOCATION: ${locationInfo}
COUNCIL: ${council.name} (${council.type_name})
${photoInfo}
${userInfo}

Requirements:
1. Write a clear, concise subject line
2. Address the appropriate department (Rights of Way / Highways)
3. Clearly describe the issue and its location
4. Reference the council's duty to maintain public rights of way under the Highways Act 1980
5. Request appropriate action
6. Maintain a respectful, professional tone
7. Write in British English
8. Keep the email concise but comprehensive
9. End with a note that this was sent via the Path Warden app
10. Sign off with "Yours faithfully, The Path Warden Team${userSignature}"

Return your response in the following JSON format:
{
  "subject": "Email subject line",
  "body": "Full email body text"
}`;

  const openai = getOpenAIClient();

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: 'You are an expert at writing formal correspondence to UK local authorities about public rights of way issues. Always respond with valid JSON.',
      },
      {
        role: 'user',
        content: prompt,
      },
    ],
    response_format: { type: 'json_object' },
    temperature: 0.7,
    max_tokens: 1000,
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error('No response from OpenAI');
  }

  try {
    const result = JSON.parse(content);
    return {
      subject: result.subject,
      body: result.body,
    };
  } catch {
    throw new Error('Failed to parse OpenAI response');
  }
}

/**
 * Generate a summary of an issue for display
 */
export async function generateIssueSummary(description: string): Promise<string> {
  const openai = getOpenAIClient();

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: 'Summarize the following footpath issue in one clear, concise sentence (max 100 characters).',
      },
      {
        role: 'user',
        content: description,
      },
    ],
    temperature: 0.3,
    max_tokens: 50,
  });

  return response.choices[0]?.message?.content || description.substring(0, 100);
}
