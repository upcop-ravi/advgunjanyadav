import pathlib, re

root = pathlib.Path(r'e:\\SUPER 250 PROJECT\\Adv Gunjan legal Associates\\advocateravishankaryadav')
placeholder = 'images/placeholder_advocate.png'
pattern = re.compile(r'(?i)(<img[^>]*\bsrc\s*=\s*)"[^\"]*"')

for html_path in root.rglob('*.html'):
    text = html_path.read_text(encoding='utf-8')
    new_text = pattern.sub(r'\1"' + placeholder + '"', text)
    html_path.write_text(new_text, encoding='utf-8')
