"""
올림픽공원 2025 차량입출차·공연·날씨 연계 데이터 받기
- 실행: pip install requests pandas → 환경변수 KCISA_API_KEY 에 서비스 키 넣기 → python get_olympicpark_data.py
- 결과: olympicpark_raw.csv (원본), olympicpark_clean.csv (DESCRIPTION을 컬럼으로 분리)
"""
import os
import re
import time
import xml.etree.ElementTree as ET

import pandas as pd
import requests

KEY = os.environ.get("KCISA_API_KEY", "")  # 서비스 키는 코드에 적지 말고 환경변수로 넣어요
if not KEY:
    raise SystemExit("서비스 키가 없어요. 터미널에서  export KCISA_API_KEY=발급받은키  (Windows: set KCISA_API_KEY=발급받은키) 후 다시 실행하세요.")
URL = "https://api.kcisa.kr/openapi/API_CPM_009/request"
PER_PAGE = 1000
FIELDS = ["TITLE", "URL", "LOCAL_ID", "ISSUED_DATE", "DESCRIPTION", "COLLECTED_DATE", "REG_DT"]
DESC_KEYS = ["주차대수", "방문객", "기온", "풍향", "강수량", "습도", "휴일", "공연명", "공연관람객수"]


def fetch_page(page):
    """한 페이지를 받아 (항목 리스트, 전체 건수)를 돌려준다. 실패 시 3번까지 재시도."""
    params = {"serviceKey": KEY, "numOfRows": PER_PAGE, "pageNo": page}
    for attempt in range(3):
        try:
            r = requests.get(URL, params=params, timeout=60)
            r.raise_for_status()
            root = ET.fromstring(r.content)
            code = root.findtext("header/resultCode")
            if code != "0000":
                raise RuntimeError(f"API 오류 {code}: {root.findtext('header/resultMsg')}")
            total = int(root.findtext("body/totalCount") or 0)
            items = [{f: (it.findtext(f) or "").strip() for f in FIELDS}
                     for it in root.findall("body/items/item")]
            return items, total
        except Exception as e:
            print(f"  {page}페이지 실패 ({attempt + 1}/3): {e}")
            time.sleep(3)
    raise SystemExit("계속 실패했어요. 점검 시간인지, 키가 맞는지 확인하세요.\n응답:\n" + r.text[:500])


def parse_description(text):
    """'주차대수:19,방문객:57, ... ,공연명:OO,공연관람객수:0' → dict
    공연명 안에 쉼표나 콜론이 있어도 깨지지 않도록 항목 이름 위치로 자른다."""
    pattern = r"(" + "|".join(DESC_KEYS) + r")\s*:"
    matches = list(re.finditer(pattern, text))
    out = {}
    for i, m in enumerate(matches):
        end = matches[i + 1].start() if i + 1 < len(matches) else len(text)
        out[m.group(1)] = text[m.end():end].strip().rstrip(",").strip()
    return out


def main():
    rows, page = [], 1
    while True:
        items, total = fetch_page(page)
        if page == 1:
            print(f"전체 건수: {total}")
            if total == 0:
                raise SystemExit("0건이에요. 점검 종료 후 다시 시도하거나 담당자에게 문의하세요.")
        rows += items
        print(f"  {page}페이지 완료 → 누적 {len(rows)}/{total}")
        if not items or len(rows) >= total:
            break
        page += 1
        time.sleep(0.5)

    raw = pd.DataFrame(rows)
    raw.to_csv("olympicpark_raw.csv", index=False, encoding="utf-8-sig")

    desc = pd.DataFrame([parse_description(d) for d in raw["DESCRIPTION"]])
    df = pd.concat([raw[["LOCAL_ID", "ISSUED_DATE"]], desc], axis=1)
    df["일시"] = pd.to_datetime(df["ISSUED_DATE"], errors="coerce")
    for c in ["주차대수", "방문객", "기온", "풍향", "강수량", "습도", "공연관람객수"]:
        if c in df:
            df[c] = pd.to_numeric(df[c].replace("", None), errors="coerce")
    df = df.drop_duplicates("LOCAL_ID").sort_values("일시")
    df.to_csv("olympicpark_clean.csv", index=False, encoding="utf-8-sig")

    print("\n저장 완료: olympicpark_raw.csv, olympicpark_clean.csv")
    print(f"기간: {df['일시'].min()} ~ {df['일시'].max()}, {len(df)}건")
    print(f"공연명 있는 기록: {(df['공연명'].fillna('') != '').sum()}건")
    print("시간대별 기록 수:")
    print(df["일시"].dt.hour.value_counts().sort_index().to_string())


if __name__ == "__main__":
    main()
