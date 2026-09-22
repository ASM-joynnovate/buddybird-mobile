---
version: 1
slug: "app-screens-home-homescreen-tsx"
primary_target: "app/screens/Home/HomeScreen.tsx"
related_targets: ["app/screens/Session","app/screens/Records","app/screens/Report"]
---

# v2 화면

범위는 SPEC-0001의 31개 화면이고 모드는 Operate다.
사용자는 집을 나서기 전 세션을 시작하고, 외출 중 상태를 확인하고, 귀가 후 결과를 듣는다.
피할 것은 모든 항목을 같은 크기로 늘어놓은 빽빽한 화면과 새장 앞에서 빛나는 화면이다.

## Direction contract

THESIS: 앵무새가 화면의 주인공이고 세션 상태는 그 옆의 한 줄 정보다. 대시보드처럼 카드를 같은 크기로 쌓는 배치를 거부한다.
OWN-WORLD: DESIGN.md의 흰 바탕, 엣지 두께 버튼, 오렌지 주 행동, Pretendard를 그대로 쓴다. 새장 앞 화면만 검은 바탕에 아주 어두운 선과 글자를 쓴다.
STORY: 홈에서 앵무새와 따라 한 소리를 먼저 보고, 필요하면 세션 줄을 눌러 모니터로 간다. 기록과 요약은 부재중 띠로 자리를 비운 하루를 읽게 한다.
FIRST VIEWPORT: 홈은 위부터 상단 바, 세션 상태 한 줄, 응급 상황 줄, 큰 앵무새 카드, 앵무새 말풍선 형태의 최근 발성, 폭을 채운 시작 버튼 순서다. 폭을 채우지 않는 버튼은 모두 오른쪽 끝에 둔다.
FORM: 홈은 앵무새 주인공 배치이며 후보 목록 2위, seed e1c61770이다. 세션 진행은 지평선 반원 링, 세션 요약은 띠 먼저, 세션 모니터는 영상 고정 아래 스크롤, 리포트는 차트 먼저, 기록은 하루 시간 막대와 단어 중심 세션 카드, 세션 상세는 띠 안에 요약이다.
FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
