import { IssueForm } from '@/components/IssueForm/IssueForm';

export const metadata = {
  title: 'Report an Issue - Path Warden',
  description: 'Report a problem with a UK public footpath, bridleway, or right of way',
};

export default function NewIssuePage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Report an Issue</h1>
        <p className="text-gray-600 mt-2">
          Found a problem on a public path? Report it here and we&apos;ll help you notify the responsible authority.
        </p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 md:p-8">
        <IssueForm />
      </div>
    </div>
  );
}
