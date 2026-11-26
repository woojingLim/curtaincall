"""기획서용 데이터 흐름 그림. 사용: python3 -I make_flow.py <출력 png>"""
import sys
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from matplotlib.patches import FancyBboxPatch, FancyArrowPatch
from matplotlib import font_manager
names = {f.name for f in font_manager.fontManager.ttflist}
for c in ['Noto Sans CJK KR', 'NanumGothic']:
    if c in names: plt.rcParams['font.family'] = c; break
fig, ax = plt.subplots(figsize=(10, 4.3), dpi=200); ax.set_xlim(0, 100); ax.set_ylim(0, 44); ax.axis('off')
def box(x, y, w, h, title, lines, fc, ec, tc='#101828'):
    ax.add_patch(FancyBboxPatch((x, y), w, h, boxstyle='round,pad=0.25,rounding_size=1.2', fc=fc, ec=ec, lw=1.2))
    ax.text(x + 1.2, y + h - 1.6, title, fontsize=9.6, fontweight='bold', color=tc, va='top')
    for i, l in enumerate(lines): ax.text(x + 1.2, y + h - 4.8 - i * 2.55, l, fontsize=7.6, color='#344054', va='top')
def arrow(x1, y1, x2, y2):
    ax.add_patch(FancyArrowPatch((x1, y1), (x2, y2), arrowstyle='-|>', mutation_scale=14, lw=1.4, color='#667085'))
ax.text(0.5, 43.2, '① 공공데이터', fontsize=10.5, fontweight='bold', color='#1D4ED8')
ax.text(27.5, 43.2, '② 가공·결합', fontsize=10.5, fontweight='bold', color='#1D4ED8')
ax.text(51.5, 43.2, '③ 분석·시뮬레이션', fontsize=10.5, fontweight='bold', color='#1D4ED8')
ax.text(76.5, 43.2, '④ 서비스(지도형 웹)', fontsize=10.5, fontweight='bold', color='#1D4ED8')
box(0.5, 22.5, 23.5, 18.5, '한국체육산업개발 (기관 데이터 3종)', ['· 차량입출차·공연·날씨 연계 데이터', '   (오픈API, 1시간, 7,803건)', '· 공연정보·대관정보 (오픈API)', '· 주차장 혼잡도 정보 (구역·시각)'], '#EAF1FF', '#93B4F5')
box(0.5, 1.0, 23.5, 19.5, '서울교통공사 (공동 활용 3종)', ['· 역별 시간대별 승하차 (1~8호선)', '· 9호선 2·3단계 승하차 (순승차)', '· 열차운행시각표 (주변 7개 역)', '+ 카카오맵 도보 시간 (팀 측정)'], '#F1EDFF', '#B9A8F0')
box(27.5, 1.0, 20.5, 40.0, '공연 종료 기준 데이터', ['· 공연 기준표 293건(151일)', '  → 페스티벌 단독일 7일 제외', '  → 144일·286건', '· 추정 종료 = 시작 + 러닝타임', '  (콘서트 150·팬미팅 120·', '   쇼케이스 90분)', '· 날짜·시각으로 주차·5개 역', '  승차(5·9호선 합산) 결합', '· 비공연 평일 시간대 평균', '· 결측은 0으로 채우지 않음', '· audit.py: 원본 CSV와 대조', '  (불일치 0건)'], '#F8FAFC', '#CBD5E1')
box(51.5, 22.5, 21.5, 18.5, '관측 분석', ['· 추정 종료 ±2시간 피크', '· 평일 대비 13.1배', '· 종료 간격 0분 vs 60분+', '  역 17.4%·주차 21.6% 차이', '· 보정 회귀 약 20% (77일)'], '#ECFDF3', '#86D7A6')
box(51.5, 1.0, 21.5, 19.5, '시나리오·미리보기 (가정)', ['· 종료 시각 조정: 인원 보존', '  60분 15.5% (20일)', '· 대체 역 분산: 참고 상한', '  20% 18.2% (144일)', '· 새 일정: 비슷한 7일로 참고 범위', '  (범위 안 78.5%, 한 날씩 빼고 시험)'], '#FFF7ED', '#F5B57A')
box(76.5, 22.5, 23.0, 18.5, '운영자 모드', ['· 요약 · 새 일정 미리보기', '· 공연일(지도·시간 재생)', '· 역별 · 주차', '· 시뮬레이터', '· 운영 검토표 인쇄·PDF'], '#101828', '#101828', tc='#FFFFFF')
for t in ax.texts[-5:]: t.set_color('#E4E7EC')
box(76.5, 1.0, 23.0, 19.5, '관객 안내 미리보기', ['· 도착지·출발 시각 입력', '· 탈 역·열차(급행)·막차', '· 덜 붐볐던 역(2025 기록)', '· 공연 전·후 주변 장소', '※ 실시간 정보 아님'], '#F8FAFC', '#CBD5E1')
for y in (31, 11): arrow(24.4, y, 27.2, y if y == 31 else y)
arrow(48.3, 31, 51.2, 31); arrow(48.3, 11, 51.2, 11)
arrow(73.3, 31, 76.2, 31); arrow(73.3, 11, 76.2, 11)
fig.tight_layout(pad=0.2); fig.savefig(sys.argv[1]); print('saved')
