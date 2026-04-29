import json
import urllib.request
import urllib.parse
import sys
import time

def translate_text(text, target_lang):
    if not isinstance(text, str): return text
    if not text.strip(): return text
    
    url = "https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=" + target_lang + "&dt=t&q=" + urllib.parse.quote(text)
    
    max_retries = 3
    for _ in range(max_retries):
        try:
            req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
            response = urllib.request.urlopen(req)
            result = json.loads(response.read().decode('utf-8'))
            return "".join([x[0] for x in result[0]])
        except Exception as e:
            time.sleep(1)
            continue
    return text

def translate_dict(d, target_lang):
    out = {}
    for k, v in d.items():
        if isinstance(v, dict):
            out[k] = translate_dict(v, target_lang)
        elif isinstance(v, list):
            out[k] = [translate_text(item, target_lang) if isinstance(item, str) else item for item in v]
        elif isinstance(v, str):
            # Try to preserve {{variables}}
            # This is a bit tricky with simple translate API, it might translate "count" inside {{count}}
            out[k] = translate_text(v, target_lang)
        else:
            out[k] = v
    return out

if __name__ == "__main__":
    if len(sys.argv) < 2:
        sys.exit(1)
        
    target_lang = sys.argv[1]
    print(f"Translating to {target_lang}...")
    
    with open('src/i18n/locales/en.json', 'r', encoding='utf-8') as f:
        data = json.load(f)
        
    translated = translate_dict(data, target_lang)
    
    with open(f'src/i18n/locales/{target_lang}.json', 'w', encoding='utf-8') as f:
        json.dump(translated, f, indent=2, ensure_ascii=False)
    
    print(f"Done translating to {target_lang}")
