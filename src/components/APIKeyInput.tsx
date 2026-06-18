import { Key } from 'lucide-react';

interface APIKeyInputProps {
 apiKey: string;
 setApiKey: (key: string) => void;
}

export function APIKeyInput({ apiKey, setApiKey }: APIKeyInputProps) {
 return (
 <div className="flex items-center gap-3 -md bg-white/5 border border-white/10 rounded-xl px-4 py-2 w-full md:w-auto">
 <Key size={18} className="text-gray-500" />
 <input
 type="password"
 value={apiKey}
 onChange={(e) => setApiKey(e.target.value)}
 placeholder="Enter OpenAI API Key"
 className="bg-transparent border-none outline-none text-sm text-gray-700 placeholder:text-gray-400 w-full md:w-64"
 />
 </div>
 );
}
