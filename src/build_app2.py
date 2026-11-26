"""지도 앱(app2) 하나의 HTML로 묶기. 사용: python3 -I build_app2.py <현재 index.html(D 추출)> <app2 폴더> <출력 html>"""
import json, sys
src, d2, out = sys.argv[1:4]
h = open(src, encoding='utf-8').read()
i = h.find('const D='); j = h.find('\n', i)
D = h[i + 8:j].rstrip(';')
json.loads(D)
M = open(d2 + '/M.json', encoding='utf-8').read()
css = open(d2 + '/app.css', encoding='utf-8').read()
model = open(d2 + '/model.js', encoding='utf-8').read()
js = open(d2 + '/core.js', encoding='utf-8').read() + '\n' + open(d2 + '/ui.js', encoding='utf-8').read()
shell = open(d2 + '/shell.html', encoding='utf-8').read()
html = shell.replace('/*CSS*/', css).replace('/*D*/', D).replace('/*M*/', M).replace('/*MODEL*/', model).replace('/*JS*/', js)
open(out, 'w', encoding='utf-8').write(html)
print(out, len(html))
