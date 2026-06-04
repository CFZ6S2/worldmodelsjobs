import json

file_path = r'C:\Users\cesar\Downloads\WorldModels Enterprise Engine v5 (Fixed & Global).json'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

target = '"anal", "masaje erotico", "ingles", "english"'
replacement = '"clases", "curso", "classes", "course", "уроки", "курсы"'
new_content = content.replace(target, replacement)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(new_content)
print('Patched local json successfully!')
