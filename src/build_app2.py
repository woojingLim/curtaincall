"""지도 앱 하나의 HTML로 묶기. 사용: python src/build_app2.py <현재 index.html(D 추출)> src <출력 html>
core.js → map3d.js(3D 실제 지도, 있으면) → ui.js 순서로 묶어요. map3d.js가 initMap 등을 바꿔 끼우기 때문에 ui.js보다 앞에 와야 해요."""
import json, os, sys
src, d2, out = sys.argv[1:4]
h = open(src, encoding='utf-8').read()
i = h.find('const D='); j = h.find('\n', i)
D = h[i + 8:j].rstrip(';')
json.loads(D)
rd = lambda f: open(os.path.join(d2, f), encoding='utf-8').read()
si = rd('shows_info.json') if os.path.exists(os.path.join(d2, 'shows_info.json')) else '{}'
json.loads(si)
has3d = os.path.exists(os.path.join(d2, 'map3d.js'))
css = rd('app.css') + ('\n' + rd('map3d.css') if has3d else '')
js = rd('core.js') + '\n' + (rd('map3d.js') + '\n' if has3d else '') + rd('ui.js')
html = rd('shell.html').replace('/*CSS*/', css).replace('/*D*/', D).replace('/*M*/', rd('M.json')).replace('/*MODEL*/', rd('model.js')).replace('/*SI*/', si).replace('/*JS*/', js)
open(out, 'w', encoding='utf-8').write(html)
print(out, len(html), '(3D 지도 포함)' if has3d else '(약도만)')
