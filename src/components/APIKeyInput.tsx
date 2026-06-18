import { Key } from 'lucide-react';

interface APIKeyInputProps {
  apiKey: string;
  setApiKey: (key: string) => void;
}

export function APIKeyInput({ apiKey, setApiKey }: APIKeyInputProps) {
  return (
    <div className="flex items-center gap-3 backdrop-blur-md bg-white/5 border border-white/10 rounded-xl px-4 py-2 w-full md:w-auto">
      <Key size={18} className="text-slate-400" />
      <input
        type="password"
        value={apiKey}
        onChange={(e) => setApiKey(e.target.value)}
        placeholder="Enter OpenAI API Key"
        className="bg-transparent border-none outline-none text-sm text-slate-200 placeholder:text-slate-500 w-full md:w-64"
      />
    </div>
  );
}
