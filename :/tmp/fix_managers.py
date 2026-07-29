import sys, re

managers_block = """MANAGERS = [
    {\"name\": \"Карымова\", \"id\": \"1MUMnGPnWf6aIOnhPF6xRZkj-t9oi90i_ZwoU49O9xbY\"},
    {\"name\": \"Надежда\", \"id\": \"1Y904RUIhMtlCFdWQtJMkcAJwzfD4NwO_FIlxk3udflo\"},
    {\"name\": \"Пешкова\", \"id\": \"1zSlpwmDcji_1CMa7ReAzqcPEtdPRWxVuxxqowmjkHek\"},
]"""

for path in sys.argv[1:]:
    text = open(path, encoding='utf-8').read()
    text = re.sub(r'MANAGERS = \[[^\]]+\]', managers_block, text, flags=re.DOTALL)
    open(path, 'w', encoding='utf-8').write(text)
    print(f'Updated {path}')
