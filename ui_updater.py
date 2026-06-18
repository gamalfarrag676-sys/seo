import os
import re

directories = ['src/pages', 'src/components']

replacements = [
    # Backgrounds and containers
    (r'\bglass-card\b', 'card'),
    (r'\bpremium-input\b', 'input'),
    (r'\bbtn-premium\b', 'btn btn-primary'),
    (r'\bbg-slate-900(?:/50|/30)?\b', 'bg-gray-50'),
    (r'\bbg-slate-950\b', 'bg-gray-50'),
    (r'\bbg-slate-800(?:/50|/30)?\b', 'bg-gray-100'),
    (r'\bbg-slate-700(?:/50|/30)?\b', 'bg-gray-200'),
    (r'\bbackdrop-blur-xl\b', ''),
    (r'\bbackdrop-blur\b', ''),
    
    # Text colors
    (r'\btext-white\b', 'text-gray-900'),
    (r'\btext-slate-100\b', 'text-gray-800'),
    (r'\btext-slate-200\b', 'text-gray-700'),
    (r'\btext-slate-300\b', 'text-gray-600'),
    (r'\btext-slate-400\b', 'text-gray-500'),
    (r'\btext-slate-500\b', 'text-gray-400'),
    
    # Border colors
    (r'\bborder-slate-800(?:/50)?\b', 'border-gray-200'),
    (r'\bborder-slate-700(?:/50)?\b', 'border-gray-200'),
    (r'\bborder-slate-600(?:/50)?\b', 'border-gray-300'),
    
    # Primary colors (Indigo/Purple -> Blue)
    (r'\bbg-indigo-600\b', 'bg-blue-600'),
    (r'\bbg-indigo-500(?:/\d+)?\b', 'bg-blue-500'),
    (r'\btext-indigo-400\b', 'text-blue-600'),
    (r'\btext-indigo-500\b', 'text-blue-500'),
    (r'\bring-indigo-500(?:/\d+)?\b', 'ring-blue-500'),
    (r'\btext-indigo-300\b', 'text-blue-500'),
    
    (r'\bbg-purple-600\b', 'bg-blue-600'),
    (r'\bbg-purple-500(?:/\d+)?\b', 'bg-blue-500'),
    (r'\btext-purple-400\b', 'text-blue-600'),
    (r'\btext-purple-500\b', 'text-blue-500'),
    (r'\bring-purple-500(?:/\d+)?\b', 'ring-blue-500'),
    
    # Dividers
    (r'\bdivide-slate-800\b', 'divide-gray-200'),
    (r'\bdivide-slate-700\b', 'divide-gray-200'),
    
    # Misc classes
    (r'\banimate-fade-in-up\b', 'animate-fade-in'),
    (r'\bplaceholder-slate-500\b', 'placeholder-gray-400'),
    (r'\bplaceholder-slate-400\b', 'placeholder-gray-400'),
]

updated_files = []

for d in directories:
    if not os.path.exists(d): continue
    for root, dirs, files in os.walk(d):
        for file in files:
            if file.endswith('.tsx') or file.endswith('.ts'):
                # skip Sidebar and TopNav and CompetitorAnalysis since they are fully updated by user
                if file in ['Sidebar.tsx', 'TopNav.tsx', 'CompetitorAnalysis.tsx']:
                    continue
                path = os.path.join(root, file)
                with open(path, 'r', encoding='utf-8') as f:
                    content = f.read()
                
                original_content = content
                for pattern, repl in replacements:
                    content = re.sub(pattern, repl, content)
                
                # Cleanup double spaces from removed classes
                content = re.sub(r' +', ' ', content)
                
                if content != original_content:
                    with open(path, 'w', encoding='utf-8') as f:
                        f.write(content)
                    updated_files.append(path)

print(f"✅ Updated {len(updated_files)} files!")
for file in updated_files:
    print(f"  - {file}")
