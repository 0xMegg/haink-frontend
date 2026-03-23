import { proxyBackendJson } from '@/lib/backend-api';

const DEFAULT_IMPORT_FILE = './row_data.xlsx';

export async function POST(request: Request) {
  return proxyBackendJson(request, '/operations/import', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      file: process.env.ONBOARDING_IMPORT_FILE_PATH?.trim() || DEFAULT_IMPORT_FILE,
    }),
  });
}
