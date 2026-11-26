"""V3 결과 엑셀: 공연일별 값 + 수식으로 계산하는 요약. 사용: python3 -I make_xlsx_v3.py <결과 폴더> <출력 xlsx>"""
import csv, sys, os
from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.utils import get_column_letter

RES, OUT = sys.argv[1:3]
def rd(n): return list(csv.DictReader(open(os.path.join(RES, n), encoding='utf-8-sig')))
num = lambda v: None if v in ('', 'None', None) else (int(float(v)) if float(v).is_integer() else float(v))
F = Font(name='Arial', size=10); FB = Font(name='Arial', size=10, bold=True); FT = Font(name='Arial', size=13, bold=True)
HF = PatternFill('solid', start_color='1F3864'); HFont = Font(name='Arial', size=10, bold=True, color='FFFFFF')
thin = Side(style='thin', color='D9D9D9'); BD = Border(bottom=thin)
wb = Workbook()

def sheet(title, header, rows, widths):
    ws = wb.create_sheet(title)
    ws.append(header)
    for c in ws[1]: c.font = HFont; c.fill = HF; c.alignment = Alignment(horizontal='center', vertical='center', wrap_text=True)
    for r in rows: ws.append(r)
    for row in ws.iter_rows(min_row=2):
        for c in row: c.font = F
    for i, w in enumerate(widths, 1): ws.column_dimensions[get_column_letter(i)].width = w
    ws.freeze_panes = 'A2'; ws.row_dimensions[1].height = 32
    return ws

# 1) 관측
ob = rd('관측_공연일별_피크.csv')
H1 = ['날짜', '추정 종료', '공연 수', '종료 예정 간격(분)', '피크 시간대(시)', '올림픽공원역 피크 승차(5·9호선)', '5호선 승차', '9호선 순승차', '몽촌토성', '방이', '한성백제', '둔촌오륜', '비공연 평일 같은 시간 평균', '주차 순감소 피크 시간대(시)', '주차 순감소 피크(대)']
K1 = ['date', 'estimated_end', 'event_count', 'estimated_gap_min', 'rail_peak_hour', 'rail_peak', 'olympic5', 'olympic9', 'mongchon', 'bangi', 'hanseong', 'dunchon', 'weekday_same_hour', 'parking_netdec_peak_hour', 'parking_netdec_peak']
ws1 = sheet('관측_공연일별', H1, [[r[k] if k in ('date', 'estimated_end') else num(r[k]) for k in K1] for r in ob], [11, 9, 7, 10, 9, 13, 9, 9, 9, 8, 9, 9, 12, 12, 11])
n1 = len(ob) + 1
for r in range(2, n1 + 1):
    for c in (6, 7, 8, 9, 10, 11, 12, 13, 15): ws1.cell(r, c).number_format = '#,##0'
# 2) 종료 조정
sh = rd('시나리오_종료시각조정_공연일별.csv')
ws2 = sheet('시나리오_종료조정', ['늦추는 시간(분)', '날짜', '작은 공연 몫(좌석 가정)', '비교 구간', '비교 구간 관측 피크', '조정 뒤 계산 피크', '자정 이후 범위 밖 인원', '판정'],
            [[num(r['shift_min']), r['date'], num(r['small_show_share']), r['window'], num(r['peak_before']), num(r['peak_after']), num(r['overflow_after_midnight']), r['judged']] for r in sh], [12, 11, 14, 10, 14, 14, 14, 8])
n2 = len(sh) + 1
for r in range(2, n2 + 1):
    ws2.cell(r, 3).number_format = '0.0%'
    for c in (5, 6, 7): ws2.cell(r, c).number_format = '#,##0'
# 3) 대체 역
al = rd('시나리오_대체역분산_공연일별.csv')
ws3 = sheet('시나리오_대체역', ['옮기는 비율(%)', '날짜', '원래 피크 시간대(시)', '비교 구간 관측 피크', '분산 뒤 비교 구간 피크', '옮긴 인원', '미배분 인원', '몽촌토성 뒤', '방이 뒤', '한성백제 뒤', '둔촌오륜 뒤'],
            [[num(r['move_pct']), r['date'], num(r['peak_hour']), num(r['peak_before']), num(r['peak_after']), num(r['moved']), num(r['unallocated']), num(r['mongchon_after']), num(r['bangi_after']), num(r['hanseong_after']), num(r['dunchon_after'])] for r in al],
            [11, 11, 11, 13, 14, 10, 10, 10, 10, 10, 10])
n3 = len(al) + 1
for r in range(2, n3 + 1):
    for c in range(4, 12): ws3.cell(r, c).number_format = '#,##0'
# 4) 보정 회귀(파이썬 결과 값)
rg = rd('관측_종료간격_보정회귀.csv')
ws4 = sheet('보정회귀', ['대상', '모형', '표본(일)', '60분 이상 계수', '95% CI 하한', '95% CI 상한', 'p값', '0분 평균 대비(%)', '% CI 하한', '% CI 상한'],
            [[{'peak': '올림픽공원역 피크 승차', 'park': '주차 순감소 피크'}[r['target']], r['model'], num(r['n']), num(r['coef']), num(r['ci_low']), num(r['ci_high']), num(r['p_value']), num(r['pct_of_gap0_mean']), num(r['pct_ci_low']), num(r['pct_ci_high'])] for r in rg],
            [20, 34, 9, 12, 11, 11, 7, 12, 10, 10])
ws4.cell(len(rg) + 3, 1, '최소제곱 회귀(이분산 강건 표준오차 HC1). 보정 변수: 관람객 수(천 명), 요일(금·토·일·평일), 추정 종료 시간대, KSPO DOME 포함 여부, 공연 수. 관람객 수가 없는 9일은 보정 모형에서 제외. 관측 연관이며 인과효과 아님. 값은 regress_v3.py 실행 결과.').font = Font(name='Arial', size=9, italic=True)

# 5) 새 일정 미리보기 검증
lv = rd('새일정미리보기_LOO검증_공연일별.csv')
ws5 = sheet('새일정_검증', ['날짜', '실제 피크', '참고값(7일 중앙값)', '참고 범위 최소', '참고 범위 최대', '범위 안(1/0)', '오차(%)', '실제 피크 시간대', '참고 피크 시간대', '비슷한 날 7일'],
            [[r['date'], num(r['actual_peak']), num(r['ref_median']), num(r['ref_low']), num(r['ref_high']), num(r['within_range']), num(r['abs_pct_error']), num(r['actual_peak_hour']), num(r['ref_peak_hour']), r['similar_days']] for r in lv],
            [11, 10, 13, 12, 12, 10, 8, 12, 12, 80])
n5 = len(lv) + 1
for r in range(2, n5 + 1):
    for c in (2, 3, 4, 5): ws5.cell(r, c).number_format = '#,##0'
# 0) 요약(수식)
ws = wb.active; ws.title = '요약'
ws['A1'] = '커튼콜 이후 · 결과 요약 (V3: 검토판 모델 + 지도 앱)'; ws['A1'].font = FT
ws['A2'] = '아래 값은 다른 시트의 공연일별 값을 수식으로 계산해요. 파란 글씨 칸(늦추는 시간·옮기는 비율)을 바꾸면 해당 결과가 다시 계산돼요.'; ws['A2'].font = Font(name='Arial', size=9, color='595959')
O = "'관측_공연일별'"; S2 = "'시나리오_종료조정'"; S3 = "'시나리오_대체역'"
rng = lambda sh, col, n: f"{sh}!${col}$2:${col}${n}"
rows = [
    ('관측 (2025년 기록)', None, None, None),
    ('분석 공연일', f'=COUNTA({rng(O, "A", n1)})', '일', '공연 기준표 293건(151일) 중 페스티벌 단독일 7일 제외'),
    ('올림픽공원역 평균 피크 1시간 승차', f'=AVERAGE({rng(O, "F", n1)})', '명', '추정 종료 ±2시간 중 최대 1시간, 5호선 승차+9호선 순승차'),
    ('비공연 평일 같은 시간 평균 대비', f'=SUM({rng(O, "F", n1)})/SUM({rng(O, "M", n1)})', '배', '평균의 비'),
    ('종료 예정 간격 0분 공연일 수', f'=COUNTIFS({rng(O, "D", n1)},0)', '일', None),
    ('종료 예정 간격 60분 이상 공연일 수', f'=COUNTIFS({rng(O, "D", n1)},">=60")', '일', None),
    ('간격 0분 평균 역 피크', f'=AVERAGEIFS({rng(O, "F", n1)},{rng(O, "D", n1)},0)', '명', None),
    ('간격 60분 이상 평균 역 피크', f'=AVERAGEIFS({rng(O, "F", n1)},{rng(O, "D", n1)},">=60")', '명', None),
    ('역 피크 관측 차이', '=1-B11/B10', '%', '관측 차이, 인과효과 아님'),
    ('간격 0분 평균 주차 순감소 피크', f'=AVERAGEIFS({rng(O, "O", n1)},{rng(O, "D", n1)},0)', '대', '주차 기록 있는 날만(빈칸 제외)'),
    ('간격 60분 이상 평균 주차 순감소 피크', f'=AVERAGEIFS({rng(O, "O", n1)},{rng(O, "D", n1)},">=60")', '대', None),
    ('주차 순감소 피크 관측 차이', '=1-B14/B13', '%', '순감소 = 출차 − 입차(실제 출차 대수 아님)'),
    ('보정 회귀: 역 피크 차이(0분 평균 대비)', "='보정회귀'!H3/100", '%', "95% CI는 '보정회귀' 시트"),
    ('시나리오 (가정 기반 계산)', None, None, None),
    ('종료 조정: 늦추는 시간', 60, '분', '30·60·90·120 중 선택'),
    ('계산 대상 날 수(자정 전 완료)', f'=COUNTIFS({rng(S2, "A", n2)},B18,{rng(S2, "H", n2)},"계산")', '일', '범위 밖으로 넘어가는 날은 판정 보류'),
    ('조정 전 평균 피크', f'=AVERAGEIFS({rng(S2, "E", n2)},{rng(S2, "A", n2)},B18,{rng(S2, "H", n2)},"계산")', '명', None),
    ('조정 뒤 평균 피크', f'=AVERAGEIFS({rng(S2, "F", n2)},{rng(S2, "A", n2)},B18,{rng(S2, "H", n2)},"계산")', '명', None),
    ('종료 조정 피크 감소율', '=1-B21/B20', '%', '표본이 다른 시간끼리 바로 비교하지 않기'),
    ('대체 역: 옮기는 비율', 20, '%', '10·20·30·50 중 선택'),
    ('분산 뒤 평균 피크', f'=AVERAGEIFS({rng(S3, "E", n3)},{rng(S3, "A", n3)},B23)', '명', None),
    ('대체 역 피크 감소율', '=1-B24/B6', '%', '144일 평균 기준'),
    ('미배분이 생긴 날', f'=COUNTIFS({rng(S3, "A", n3)},B23,{rng(S3, "G", n3)},">0.01")', '일', '참고 상한(평일 평균 최고치)을 넘는 몫은 옮기지 않음'),
    ('새 일정 미리보기 검증 (비슷한 7일, 한 날씩 빼고 시험)', None, None, None),
    ('실제 피크가 참고 범위 안에 든 비율', f"=AVERAGE('새일정_검증'!$F$2:$F${n5})", '%', '참고 범위 = 비슷한 7일 피크의 최소~최대'),
    ('참고값과의 오차(중앙값)', f"=MEDIAN('새일정_검증'!$G$2:$G${n5})/100", '%', '예상 관객 수를 넣지 않은 경우'),
    ('피크 시간대 ±1시간 안 비율', f"=SUMPRODUCT(--(ABS('새일정_검증'!$H$2:$H${n5}-'새일정_검증'!$I$2:$I${n5})<=1))/COUNT('새일정_검증'!$H$2:$H${n5})", '%', None),
]
for i, (a, b, c, d) in enumerate(rows, start=4):
    ws.cell(i, 1, a); ws.cell(i, 2, b); ws.cell(i, 3, c); ws.cell(i, 4, d)
    for col in range(1, 5): ws.cell(i, col).font = F; ws.cell(i, col).border = BD
    if b is None:
        ws.cell(i, 1).font = FB; ws.cell(i, 1).fill = PatternFill('solid', start_color='E7ECF5')
    if c == '%': ws.cell(i, 2).number_format = '0.0%'
    elif c == '배': ws.cell(i, 2).number_format = '0.00'
    elif isinstance(b, str): ws.cell(i, 2).number_format = '#,##0.0'
ws['B18'].font = Font(name='Arial', size=10, color='0000FF'); ws['B23'].font = Font(name='Arial', size=10, color='0000FF')
for cell in ('B18', 'B23'): ws[cell].fill = PatternFill('solid', start_color='FFF2CC')
ws.column_dimensions['A'].width = 38; ws.column_dimensions['B'].width = 14; ws.column_dimensions['C'].width = 6; ws.column_dimensions['D'].width = 54
# 정의
wd = wb.create_sheet('정의·가정')
for r in [('항목', '내용'), ('피크', '마지막 추정 종료 시각이 속한 시간대 ±2시간(자료가 있는 범위) 안의 최대 1시간'), ('승차', '올림픽공원역 = 5호선 승차 + 9호선 순승차(환승 제외). 1시간 단위'),
          ('추정 종료', '시작 시각 + 공연 유형별 러닝타임 가정(콘서트 150분, 팬미팅·팬콘 120분, 쇼케이스 90분). 실제 종료 기록 아님'),
          ('비교 기준', '비공연 월~목 시간대별 평균(공휴일 포함). 주말 효과는 통제 못 함'), ('평일 평균 최고치', '비공연 평일 평균 중 가장 많은 1시간. 역 수용능력이 아님(대체 역 배분의 참고 상한)'),
          ('주차 순감소', '연속 두 시각 주차 차량 수의 차이(출차 − 입차). 실제 출차 대수 아님. 결측은 0으로 채우지 않음'),
          ('종료 조정', '종료 예정 간격 0분인 정확히 두 공연일(23일)에 작은 공연 몫(좌석 비율)의 초과 승차를 늦춤. 인원 보존, 자정 이후로 넘어가면 판정 보류'),
          ('대체 역 분산', '원래 피크 시간 초과 승차의 일부를 4개 역에 참고 상한까지의 여유에 비례 배분, 넘는 몫은 미배분. 이동 뒤 비교 구간 피크 재계산'),
          ('주의', '두 시나리오는 독립 계산이라 감소율을 더하면 안 됨. 관측 비교·회귀는 연관이며 인과효과 아님. 실제 대기시간·안전 개선을 보장하지 않음'),
          ('새 일정 미리보기', '공연장 구성·추정 종료 시간대·종료 간격·요일(·예상 관객 수)이 가장 비슷한 2025년 공연일 7일의 피크 중앙값·최소~최대. 예측 모델이 아니라 유사 사례 참고값'),
          ('재현', 'audit.py(내장 데이터↔원본 CSV 대조), audit_model.js(모델 검사·요약), make_figs_v3.py·regress_v3.py·similar_eval.py(그림·결과표·검증)')]:
    wd.append(r)
for c in wd[1]: c.font = HFont; c.fill = HF
for row in wd.iter_rows(min_row=2):
    row[0].font = FB; row[1].font = F; row[1].alignment = Alignment(wrap_text=True, vertical='top')
wd.column_dimensions['A'].width = 16; wd.column_dimensions['B'].width = 100
wb.move_sheet('정의·가정', offset=-(len(wb.sheetnames) - 2))
wb.save(OUT); print('saved', OUT, wb.sheetnames)
