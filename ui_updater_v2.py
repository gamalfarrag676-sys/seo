import os
import re

directories = ['src/pages', 'src/components', 'src/contexts']

replacements = [
    # Leftover slate
    (r'\btext-slate-800\b', 'text-gray-800'),
    (r'\btext-slate-700\b', 'text-gray-700'),
    (r'\btext-slate-600\b', 'text-gray-600'),
    (r'\btext-slate-500\b', 'text-gray-500'),
    (r'\btext-slate-400\b', 'text-gray-400'),
    
    (r'\bbg-slate-600(?:/50|/30)?\b', 'bg-gray-200'),
    (r'\bbg-slate-500(?:/20)?\b', 'bg-gray-100'),
    (r'\bborder-slate-500(?:/30)?\b', 'border-gray-200'),
    (r'\bplaceholder:text-slate-600\b', 'placeholder:text-gray-400'),
    (r'\bstroke-slate-800\b', 'stroke-gray-800'),
    
    # Leftover indigo
    (r'\bborder-indigo-500(?:/50|/30|/20)?\b', 'border-blue-200'),
    (r'\bborder-indigo-400\b', 'border-blue-300'),
    (r'\bring-indigo-400\b', 'ring-blue-300'),
    (r'\bhover:border-indigo-500\b', 'hover:border-blue-500'),
    (r'\bhover:border-indigo-400\b', 'hover:border-blue-400'),
    (r'\bfocus:border-indigo-500\b', 'focus:border-blue-500'),
    (r'\bfocus:border-indigo-400\b', 'focus:border-blue-400'),
    (r'\btext-indigo-700\b', 'text-blue-700'),
    
    # Tag colors that look bad (e.g. bg-blue-500 text-blue-600)
    (r'\bbg-blue-500 text-blue-600\b', 'bg-blue-50 text-blue-700'),
    (r'\bbg-blue-600/20\b', 'bg-blue-100'),
    (r'\bbg-blue-600/30\b', 'bg-blue-100'),
    
    # Leftover gradients
    (r'\bbg-gradient-to-l from-indigo-500 to-purple-500\b', 'bg-blue-500'),
    (r'\bbg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500\b', 'bg-blue-500'),
    
    # Fix main.tsx specifically (Spinner)
    (r'\bborder-indigo-500/30\b', 'border-blue-200'),
    (r'\bborder-t-indigo-500\b', 'border-t-blue-500'),
]

updated_files = []

for d in directories:
    if not os.path.exists(d): continue
    for root, dirs, files in os.walk(d):
        for file in files:
            if file.endswith('.tsx') or file.endswith('.ts'):
                if file in ['Sidebar.tsx', 'TopNav.tsx', 'CompetitorAnalysis.tsx']:
                    continue
                path = os.path.join(root, file)
                with open(path, 'r', encoding='utf-8') as f:
                    content = f.read()
                
                original_content = content
                for pattern, repl in replacements:
                    content = re.sub(pattern, repl, content)
                
                if content != original_content:
                    with open(path, 'w', encoding='utf-8') as f:
                        f.write(content)
                    updated_files.append(path)

# Also fix main.tsx
main_path = 'src/main.tsx'
if os.path.exists(main_path):
    with open(main_path, 'r', encoding='utf-8') as f:
        content = f.read()
    original_content = content
    for pattern, repl in replacements:
        content = re.sub(pattern, repl, content)
    if content != original_content:
        with open(main_path, 'w', encoding='utf-8') as f:
            f.write(content)
        updated_files.append(main_path)


print(f"✅ Polished {len(updated_files)} files!")
for file in updated_files:
    print(f"  - {file}")
