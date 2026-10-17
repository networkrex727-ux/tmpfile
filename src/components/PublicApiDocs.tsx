import React, { useState } from 'react';
import {
  Terminal,
  Copy,
  Check,
  Send,
  Server,
  Play,
} from 'lucide-react';
import { ExpirationPlan } from '../types';

export const PublicApiDocs: React.FC = () => {
  const [selectedLanguage, setSelectedLanguage] = useState<'curl' | 'python' | 'node' | 'powershell'>('curl');
  const [apiPlan, setApiPlan] = useState<ExpirationPlan>('1h');
  const [copiedCode, setCopiedCode] = useState(false);

  const [testFile, setTestFile] = useState<File | null>(null);
  const [testExpires, setTestExpires] = useState<ExpirationPlan>('1h');
  const [isTesting, setIsTesting] = useState(false);
  const [testResponse, setTestResponse] = useState<any>(null);

  const originUrl = typeof window !== 'undefined' ? window.location.origin : 'https://tmpdrop.app';

  const snippets = {
    curl: `# 1. Standard Multipart Upload (Single file)
curl -F "file=@/path/to/archive.zip" \\
     -F "expires=${apiPlan}" \\
     "${originUrl}/api/upload"

# 2. Batch Upload (Upload multiple files at once)
curl -F "files=@file1.png" \\
     -F "files=@file2.pdf" \\
     -F "expires=${apiPlan}" \\
     "${originUrl}/api/upload"

# 3. Stream Upload (Direct binary stream / transfer.sh style)
curl --upload-file myfile.tar.gz \\
     "${originUrl}/api/upload/myfile.tar.gz?expires=${apiPlan}"

# 4. Burn-After-Reading Self Destruct
curl -F "file=@secret_token.txt" \\
     -F "expires=burn" \\
     "${originUrl}/api/upload"`,

    python: `import requests

url = "${originUrl}/api/upload"
files = {'file': open('sample.pdf', 'rb')}
data = {'expires': '${apiPlan}'}

response = requests.post(url, files=files, data=data)
result = response.json()

print("File URL:", result['files'][0]['url'])
print("Direct Download:", result['files'][0]['downloadUrl'])
print("Delete Token:", result['files'][0]['deleteToken'])
`,

    node: `import fs from 'node:fs';

const form = new FormData();
form.append('file', new Blob([fs.readFileSync('build.zip')]), 'build.zip');
form.append('expires', '${apiPlan}');

const response = await fetch('${originUrl}/api/upload', {
  method: 'POST',
  body: form,
});

const data = await response.json();
console.log('Upload successful:', data.files[0].url);
`,

    powershell: `$file = Get-Item -Path "./archive.zip"
$form = @{
    file = $file
    expires = "${apiPlan}"
}

$response = Invoke-RestMethod -Uri "${originUrl}/api/upload" -Method Post -Form $form
Write-Host "File URL: $($response.files[0].url)"
`,
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(snippets[selectedLanguage]);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleRunLiveTest = async () => {
    let fileToUpload = testFile;
    if (!fileToUpload) {
      const blob = new Blob([`TmpDrop Remote API Test Generated at ${new Date().toISOString()}`], {
        type: 'text/plain',
      });
      fileToUpload = new File([blob], 'api_quick_test.txt', { type: 'text/plain' });
    }

    setIsTesting(true);
    setTestResponse(null);

    try {
      const formData = new FormData();
      formData.append('file', fileToUpload);
      formData.append('expires', testExpires);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const json = await res.json();
      setTestResponse({
        status: res.status,
        statusText: res.statusText,
        body: json,
      });
    } catch (err: any) {
      setTestResponse({
        error: err.message || 'Network request failed',
      });
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="bg-neutral-900/60 border border-neutral-800 rounded-2xl p-6 sm:p-8 space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-500/20 border border-teal-500/40 flex items-center justify-center text-teal-400">
            <Terminal className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-white font-['Plus_Jakarta_Sans']">
              Public Remote Upload API
            </h2>
            <p className="text-xs sm:text-sm text-neutral-400">
              No API keys or registration required. Pipe files straight from your terminal, CI/CD pipelines, or scripts.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-neutral-800">
          <div className="bg-neutral-950 p-3 rounded-xl border border-neutral-800/80">
            <span className="text-[11px] text-neutral-500 font-mono block">ENDPOINT</span>
            <span className="text-xs font-mono font-bold text-cyan-400">POST /api/upload</span>
          </div>
          <div className="bg-neutral-950 p-3 rounded-xl border border-neutral-800/80">
            <span className="text-[11px] text-neutral-500 font-mono block">AUTH</span>
            <span className="text-xs font-mono font-bold text-emerald-400">Public (No Login)</span>
          </div>
          <div className="bg-neutral-950 p-3 rounded-xl border border-neutral-800/80">
            <span className="text-[11px] text-neutral-500 font-mono block">SUPPORTED PLANS</span>
            <span className="text-xs font-mono font-bold text-teal-300">15m, 1h, 6h, 12h, 24h, 3d, 7d, burn</span>
          </div>
          <div className="bg-neutral-950 p-3 rounded-xl border border-neutral-800/80">
            <span className="text-[11px] text-neutral-500 font-mono block">BATCH SIZE</span>
            <span className="text-xs font-mono font-bold text-indigo-300">Up to 150 files</span>
          </div>
        </div>
      </div>

      <div className="bg-neutral-900/60 border border-neutral-800 rounded-2xl p-6 space-y-4 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-800 pb-4">
          <div className="flex items-center gap-1.5 bg-neutral-950 p-1 rounded-xl border border-neutral-800">
            {(['curl', 'python', 'node', 'powershell'] as const).map((lang) => (
              <button
                key={lang}
                type="button"
                onClick={() => setSelectedLanguage(lang)}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono uppercase font-bold transition-all ${
                  selectedLanguage === lang
                    ? 'bg-neutral-800 text-cyan-400 border border-neutral-700 shadow-sm'
                    : 'text-neutral-500 hover:text-neutral-300'
                }`}
              >
                {lang}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-neutral-400 font-mono">Plan:</span>
            <select
              value={apiPlan}
              onChange={(e) => setApiPlan(e.target.value as ExpirationPlan)}
              aria-label="API Expiration Plan"
              className="bg-neutral-950 text-cyan-300 border border-neutral-800 rounded-lg px-2.5 py-1.5 text-xs font-mono focus:outline-none focus:border-cyan-500"
            >
              <option value="15m">15 Minutes (15m)</option>
              <option value="1h">1 Hour (1h)</option>
              <option value="6h">6 Hours (6h)</option>
              <option value="12h">12 Hours (12h)</option>
              <option value="24h">24 Hours (24h)</option>
              <option value="3d">3 Days (3d)</option>
              <option value="7d">7 Days (7d)</option>
              <option value="burn">Burn After Read (burn)</option>
            </select>

            <button
              type="button"
              onClick={handleCopyCode}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-semibold border border-neutral-700 transition-colors"
            >
              {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedCode ? 'Copied Snippet!' : 'Copy'}</span>
            </button>
          </div>
        </div>

        <div className="relative rounded-xl overflow-hidden bg-neutral-950 border border-neutral-800">
          <pre className="p-4 sm:p-5 text-xs font-mono text-neutral-300 overflow-x-auto leading-relaxed">
            {snippets[selectedLanguage]}
          </pre>
        </div>
      </div>

      <div className="bg-neutral-900/60 border border-neutral-800 rounded-2xl p-6 space-y-4 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-cyan-950/80 border border-cyan-800/60 flex items-center justify-center text-cyan-400">
            <Play className="w-4 h-4 fill-cyan-400" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Live In-Browser API Test Console</h3>
            <p className="text-xs text-neutral-400">
              Test sending an actual request right now to see the exact JSON response.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
          <div>
            <label className="block text-xs font-mono text-neutral-400 mb-1">Select File (Optional)</label>
            <input
              type="file"
              onChange={(e) => setTestFile(e.target.files?.[0] || null)}
              className="w-full text-xs text-neutral-400 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-neutral-800 file:text-neutral-200 hover:file:bg-neutral-700 cursor-pointer bg-neutral-950 rounded-xl p-1 border border-neutral-800"
            />
          </div>

          <div>
            <label className="block text-xs font-mono text-neutral-400 mb-1">Expiration Preset</label>
            <select
              value={testExpires}
              onChange={(e) => setTestExpires(e.target.value as ExpirationPlan)}
              className="w-full bg-neutral-950 text-neutral-200 border border-neutral-800 rounded-xl px-3 py-2 text-xs font-mono focus:outline-none focus:border-cyan-500"
            >
              <option value="15m">15 Minutes</option>
              <option value="1h">1 Hour</option>
              <option value="6h">6 Hours</option>
              <option value="12h">12 Hours</option>
              <option value="24h">24 Hours</option>
              <option value="3d">3 Days</option>
              <option value="7d">7 Days</option>
              <option value="burn">Burn After Read</option>
            </select>
          </div>

          <button
            type="button"
            onClick={handleRunLiveTest}
            disabled={isTesting}
            className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 text-neutral-950 text-xs font-bold shadow-lg shadow-teal-500/20 disabled:opacity-50 transition-all"
          >
            {isTesting ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-neutral-950 border-t-transparent rounded-full animate-spin" />
                <span>Executing API Call...</span>
              </>
            ) : (
              <>
                <Send className="w-3.5 h-3.5" />
                <span>Execute Remote Call</span>
              </>
            )}
          </button>
        </div>

        {testResponse && (
          <div className="space-y-2 pt-2">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-neutral-400">Response Payload:</span>
              <span
                className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                  testResponse.status === 201 || testResponse.status === 200
                    ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                    : 'bg-rose-950 text-rose-400 border border-rose-800'
                }`}
              >
                HTTP {testResponse.status || 'ERR'} {testResponse.statusText || ''}
              </span>
            </div>
            <pre className="p-4 bg-neutral-950 rounded-xl border border-neutral-800 text-xs font-mono text-cyan-300 overflow-x-auto max-h-60">
              {JSON.stringify(testResponse.body || testResponse.error, null, 2)}
            </pre>
          </div>
        )}
      </div>

      <div className="bg-neutral-900/60 border border-neutral-800 rounded-2xl p-6 space-y-4">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <Server className="w-4 h-4 text-cyan-400" />
          API Routes Reference
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-neutral-950 text-neutral-400 border-b border-neutral-800">
              <tr>
                <th className="p-3">Method</th>
                <th className="p-3">Route</th>
                <th className="p-3">Description</th>
                <th className="p-3">Parameters</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/60 text-neutral-300">
              <tr>
                <td className="p-3 text-cyan-400 font-bold">POST</td>
                <td className="p-3">/api/upload</td>
                <td className="p-3 font-sans text-neutral-300">Upload 1 to 150 files multipart</td>
                <td className="p-3 text-neutral-500">file, files, expires, maxDownloads, burn</td>
              </tr>
              <tr>
                <td className="p-3 text-teal-400 font-bold">PUT</td>
                <td className="p-3">/api/upload/:filename</td>
                <td className="p-3 font-sans text-neutral-300">Binary stream upload (curl -T)</td>
                <td className="p-3 text-neutral-500">?expires=1h</td>
              </tr>
              <tr>
                <td className="p-3 text-indigo-400 font-bold">GET</td>
                <td className="p-3">/api/file/:id</td>
                <td className="p-3 font-sans text-neutral-300">Get file JSON metadata</td>
                <td className="p-3 text-neutral-500">-</td>
              </tr>
              <tr>
                <td className="p-3 text-indigo-400 font-bold">GET</td>
                <td className="p-3">/api/file/:id/download</td>
                <td className="p-3 font-sans text-neutral-300">Download file directly (attachment)</td>
                <td className="p-3 text-neutral-500">-</td>
              </tr>
              <tr>
                <td className="p-3 text-indigo-400 font-bold">GET</td>
                <td className="p-3">/api/file/:id/raw</td>
                <td className="p-3 font-sans text-neutral-300">Stream file inline (previews)</td>
                <td className="p-3 text-neutral-500">-</td>
              </tr>
              <tr>
                <td className="p-3 text-amber-400 font-bold">GET</td>
                <td className="p-3">/api/batch/:id/zip</td>
                <td className="p-3 font-sans text-neutral-300">Download entire batch as ZIP archive</td>
                <td className="p-3 text-neutral-500">-</td>
              </tr>
              <tr>
                <td className="p-3 text-rose-400 font-bold">DELETE</td>
                <td className="p-3">/api/file/:id</td>
                <td className="p-3 font-sans text-neutral-300">Delete file before timer expiry</td>
                <td className="p-3 text-neutral-500">?token=... or Header X-Delete-Token</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
