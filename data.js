/* 베이비 팩토리 — 게임 데이터
   ※ 형질·효과·가격은 토론을 위한 가상 설정입니다. 금액 단위: 만원
   ※ 순서를 바꾸거나 항목을 끼워 넣으면 이미 인쇄한 QR이 다르게 읽힙니다. 새 항목은 맨 뒤에 추가하세요. */
'use strict';
var BF = window.BF || (window.BF = {});

BF.EVENT = {
  club: '독서갱',
  program: '베이비 팩토리',
  book: '세상에 대하여 우리가 더 잘 알아야 할 교양 30: 맞춤아기, 누구의 권리일까?',
  bookShort: '맞춤아기, 누구의 권리일까?',
  author: '존 블리스',
  event: '2026 인문학의 날 독서클럽 북콘서트',
  question: '부모가 원하는 특성을 선택할 수 있다면, 그것은 부모의 권리일까, 아니면 아이의 권리를 침해하는 생명의 상품화일까?',
  vote: '맞춤아기 기술의 사용을 허용해야 한다',
  disclaimer: '형질·효과·가격은 토론을 위한 가상 설정이며 실제 유전공학 기술이나 의료비가 아닙니다. 키와 지능은 여러 유전자와 성장 환경의 영향을 받아 원하는 수치로 정확히 설계할 수 없습니다.'
};

BF.CATS = [
  { id: 'looks', name: '외모', en: 'LOOKS' },
  { id: 'body', name: '몸', en: 'BODY' },
  { id: 'mind', name: '능력', en: 'MIND' },
  { id: 'health', name: '건강', en: 'HEALTH' }
];

// feas: real = 단일 유전자(현실에 가까움) / partial = 일부만 밝혀짐 / hard = 수천 개 유전자(거의 불가능)
BF.FEAS = {
  real: { label: '현실 가능', sub: '단일 유전자' },
  partial: { label: '부분적', sub: '일부 유전자만 밝혀짐' },
  hard: { label: '거의 불가능', sub: '수천 개 유전자 + 환경' }
};

BF.TRAITS = [
  // ---------------- 외모 ----------------
  { id: 'eyelid', cat: 'looks', name: '쌍꺼풀', gene: '여러 유전자', feas: 'partial', age: 20, ethic: 'consent',
    note: '눈꺼풀 모양에 관여하는 유전자가 몇 개 알려졌지만, 원하는 모양을 정확히 고르는 기술은 없어요.',
    opts: [{ label: '자연에 맡기기', price: 0 }, { label: '무쌍', price: 400 }, { label: '속쌍꺼풀', price: 600 }, { label: '또렷한 쌍꺼풀', price: 900 }] },
  { id: 'hair', cat: 'looks', name: '머리 모양', gene: 'TCHH · EDAR', feas: 'partial', age: 16, ethic: 'consent',
    note: '머리카락의 굵기와 곱슬기에 관여하는 유전자가 일부 밝혀졌어요.',
    opts: [{ label: '자연에 맡기기', price: 0 }, { label: '찰랑 직모', price: 500 }, { label: '자연 웨이브', price: 500 }, { label: '탱글 곱슬', price: 500 }] },
  { id: 'dimple', cat: 'looks', name: '보조개', gene: '아직 모름', feas: 'partial', age: 7, ethic: 'consent',
    note: '흔히 우성 유전이라고 알려졌지만, 실제 유전 방식은 아직 확실하지 않아요.',
    opts: [{ label: '자연에 맡기기', price: 0 }, { label: '양쪽 보조개', price: 400 }] },
  { id: 'freckle', cat: 'looks', name: '주근깨', gene: 'MC1R · IRF4', feas: 'partial', age: 10, ethic: 'consent',
    note: '햇빛에 반응해 생기는 주근깨는 MC1R 등 몇몇 유전자의 영향을 크게 받아요.',
    opts: [{ label: '자연에 맡기기', price: 0 }, { label: '주근깨 있게', price: 200 }, { label: '주근깨 없게', price: 300 }] },
  { id: 'teeth', cat: 'looks', name: '치열', gene: '여러 유전자', feas: 'hard', age: 13, ethic: 'consent',
    note: '턱 크기와 치아 배열은 여러 유전자와 식습관이 함께 결정해요.',
    opts: [{ label: '자연에 맡기기', price: 0 }, { label: '가지런한 치열', price: 800 }] },
  { id: 'skin', cat: 'looks', name: '피부', gene: '여러 유전자', feas: 'hard', age: 16, ethic: 'consent',
    note: '여드름은 호르몬, 피부 장벽, 수면과 식습관이 함께 영향을 줘요.',
    opts: [{ label: '자연에 맡기기', price: 0 }, { label: '여드름 없는 피부', price: 700 }] },
  { id: 'hairloss', cat: 'looks', name: '탈모', gene: 'AR 외 200여 개', feas: 'hard', age: 58, ethic: 'consent',
    note: '남성형 탈모는 AR 유전자의 영향이 크지만, 200개가 넘는 유전자가 함께 관여해요.',
    opts: [{ label: '자연에 맡기기', price: 0 }, { label: '탈모 유전자 차단', price: 2000 }] },
  { id: 'aging', cat: 'looks', name: '노화 속도', gene: '수많은 유전자', feas: 'hard', age: 80, ethic: 'uncertain',
    note: '노화와 수명에 대한 유전의 영향은 생각보다 작아요. 생활습관과 환경이 더 큰 역할을 해요.',
    opts: [{ label: '자연에 맡기기', price: 0 }, { label: '천천히 늙기', price: 4000 }] },

  // ---------------- 몸 ----------------
  { id: 'height', cat: 'body', name: '키 기대치', gene: '1만 2천여 개 변이', feas: 'hard', age: 30, ethic: 'uncertain',
    note: '키에 관여하는 유전 변이는 1만 개가 넘어요. 영양·수면·운동도 중요해서 정확한 키를 설계할 수 없어요.',
    opts: [
      { label: '자연에 맡기기', price: 0, sub: '평균 남 174 · 여 161cm' },
      { label: '상위 30%', price: 1500, sub: '기대 남 177 · 여 164cm' },
      { label: '상위 10%', price: 3500, sub: '기대 남 182 · 여 169cm' },
      { label: '상위 1%', price: 7000, sub: '기대 남 188 · 여 175cm' }] },
  { id: 'build', cat: 'body', name: '체질', gene: 'FTO 외 수백 개', feas: 'hard', age: 50, ethic: 'uncertain',
    note: '체중은 수백 개 유전자와 식습관·운동량이 함께 결정해요.',
    opts: [{ label: '자연에 맡기기', price: 0 }, { label: '살이 잘 안 찌는 체질', price: 2000 }] },
  { id: 'sport', cat: 'body', name: '운동 능력', gene: 'ACTN3 외', feas: 'partial', age: 20, ethic: 'uncertain',
    note: 'ACTN3는 "스프린터 유전자"로 불리지만, 실제 운동 능력은 훈련과 노력이 훨씬 중요해요.',
    opts: [{ label: '자연에 맡기기', price: 0 }, { label: '지구력형', price: 2500, sub: '마라톤 체질' }, { label: '순발력형', price: 2500, sub: '단거리 체질' }] },
  { id: 'eyes', cat: 'body', name: '시력', gene: '수백 개 + 환경', feas: 'hard', age: 16, ethic: 'uncertain',
    note: '한국 청소년 10명 중 7~8명이 근시예요. 실내 생활·스마트폰 같은 환경의 영향이 커요.',
    opts: [{ label: '자연에 맡기기', price: 0 }, { label: '평생 좋은 시력', price: 1500 }] },
  { id: 'sleep', cat: 'body', name: '짧은 수면', gene: 'DEC2', feas: 'real', age: 20, ethic: 'therapy',
    note: 'DEC2 변이를 가진 극소수 가족은 하루 6시간 정도만 자도 건강하다는 연구가 있어요.',
    opts: [{ label: '자연에 맡기기', price: 0 }, { label: '4~6시간만 자도 개운', price: 2500 }] },

  // ---------------- 능력 ----------------
  { id: 'iq', cat: 'mind', name: '지능 기대치', gene: '수천 개', feas: 'hard', age: 18, ethic: 'uncertain',
    note: '지능에 관여하는 유전자는 수천 개이고 하나하나의 효과는 아주 작아요. 교육과 환경의 영향도 커서 "천재 주문"은 불가능해요.',
    opts: [
      { label: '자연에 맡기기', price: 0, sub: '평균 IQ 100' },
      { label: '우수', price: 3000, sub: '기대 IQ 110 · 상위 25%' },
      { label: '영재', price: 6000, sub: '기대 IQ 120 · 상위 9%' },
      { label: '천재', price: 10000, sub: '기대 IQ 130 · 상위 2%' }] },
  { id: 'music', cat: 'mind', name: '절대음감', gene: '아직 모름', feas: 'partial', age: 10, ethic: 'uncertain',
    note: '절대음감은 타고난 소질에 더해 어릴 때 음악 훈련을 받아야 나타나요.',
    opts: [{ label: '자연에 맡기기', price: 0 }, { label: '절대음감', price: 2000 }] },
  { id: 'persona', cat: 'mind', name: '성격 경향', gene: '수천 개', feas: 'hard', age: 20, ethic: 'consent',
    note: '성격에 대한 유전의 영향은 40~50% 정도예요. 나머지는 살면서 겪는 경험이 만들어요.',
    opts: [{ label: '자연에 맡기기', price: 0 }, { label: '사교적인', price: 1500 }, { label: '차분하고 끈기 있는', price: 1500 }, { label: '긍정적이고 회복력 있는', price: 1500 }] },

  // ---------------- 건강 (선택 편집) ----------------
  { id: 'alz', cat: 'health', name: '알츠하이머 위험 낮추기', gene: 'APOE', feas: 'real', age: 80, ethic: 'therapy',
    note: 'APOE ε4형은 알츠하이머 위험을 높여요. 편집으로 위험을 낮출 수는 있지만 0이 되지는 않아요.',
    opts: [{ label: '자연에 맡기기', price: 0 }, { label: '위험 낮추기', price: 3000 }] },
  { id: 'heart', cat: 'health', name: '심혈관 질환 위험 낮추기', gene: 'PCSK9', feas: 'real', age: 55, ethic: 'therapy',
    note: 'PCSK9 유전자를 끄면 콜레스테롤이 낮아져요. 실제로 성인 대상 유전자 편집 임상시험이 진행되고 있어요.',
    opts: [{ label: '자연에 맡기기', price: 0 }, { label: '위험 낮추기', price: 2500 }] },
  { id: 'hiv', cat: 'health', name: 'HIV 저항성', gene: 'CCR5', feas: 'real', age: 30, ethic: 'hejiankui',
    note: '2018년 이 유전자를 편집한 쌍둥이가 태어나 세계적인 논란이 됐어요. 다른 감염병에는 더 약해질 수 있다는 연구도 있어요.',
    opts: [{ label: '자연에 맡기기', price: 0 }, { label: 'HIV 저항성', price: 2000 }] },
  { id: 'longevity', cat: 'health', name: '장수 유전자', gene: 'FOXO3', feas: 'hard', age: 85, ethic: 'uncertain',
    note: '오래 사는 가족에게서 자주 발견되는 변이지만, 효과는 확률을 조금 바꾸는 정도예요.',
    opts: [{ label: '자연에 맡기기', price: 0 }, { label: '장수 유전자', price: 5000 }] }
];

// 유전자 검사에서 랜덤하게 발견되는 유전질환·장애 (모두 단일 유전자 → 편집으로 높은 확률로 제거 가능)
// p: v1의 게임 속 발견 확률. v2는 sim.screen에서 절반을 적용하고 최대 2개로 제한합니다.
// 실제 발생률이 아닌 체험용 설정. success: 편집 성공률, life: 편집하지 않았을 때 기대수명 감소(년)
BF.DISORDERS = [
  { id: 'gjb2', name: '유전성 난청', kind: '청각장애', gene: 'GJB2', p: 0.17, price: 2500, success: 0.97, life: 0, ethic: 'deaf',
    real: '선천성 난청은 신생아 1,000명 중 1~3명',
    desc: '귓속에서 소리 신호를 전달하는 단백질이 만들어지지 않아 태어날 때부터 잘 듣지 못해요. 보청기·인공와우·수어로 생활해요.' },
  { id: 'rpe65', name: '레버 선천성 흑암시', kind: '시각장애', gene: 'RPE65', p: 0.10, price: 3500, success: 0.95, life: 0, ethic: 'disability',
    real: '약 4만 명 중 1명',
    desc: '망막이 빛을 제대로 감지하지 못해 어릴 때부터 시력을 잃어 가요. 2017년 이 유전자를 고치는 치료제(럭스터나)가 승인됐어요.' },
  { id: 'f8', name: '혈우병 A', kind: '혈액 질환', gene: 'F8', p: 0.13, price: 3000, success: 0.96, life: 3, ethic: 'therapy',
    real: '남자아이 5,000명 중 1명',
    desc: '피를 굳게 하는 8번 응고인자가 부족해 피가 나면 잘 멈추지 않아요. 정기적으로 응고인자 주사를 맞아요.' },
  { id: 'hbb', name: '겸상적혈구빈혈증', kind: '혈액 질환', gene: 'HBB', p: 0.09, price: 3500, success: 0.97, life: 7, ethic: 'offtarget',
    real: '전 세계에서 해마다 30만 명 이상 태어남',
    desc: '적혈구가 낫 모양으로 변해 혈관을 막고 심한 통증을 일으켜요. 2023년 세계 최초의 CRISPR 치료제(카스거비)가 승인됐어요.' },
  { id: 'pah', name: '페닐케톤뇨증', kind: '대사 질환', gene: 'PAH', p: 0.14, price: 1500, success: 0.98, life: 0, ethic: 'therapy',
    real: '약 1만~5만 명 중 1명',
    desc: '페닐알라닌이라는 아미노산을 분해하지 못해요. 평생 식단을 관리하면 건강하게 지낼 수 있어요.' },
  { id: 'ldlr', name: '가족성 고콜레스테롤혈증', kind: '심혈관 질환', gene: 'LDLR', p: 0.16, price: 2000, success: 0.97, life: 4, ethic: 'therapy',
    real: '약 250명 중 1명',
    desc: '혈액 속 나쁜 콜레스테롤을 치우지 못해 젊은 나이에 심장병이 생길 수 있어요.' },
  { id: 'brca1', name: '유전성 유방암·난소암 위험', kind: '암 위험', gene: 'BRCA1', p: 0.14, price: 2500, success: 0.97, life: 3, ethic: 'therapy',
    real: 'BRCA 변이는 약 400명 중 1명',
    desc: '손상된 DNA를 고치는 유전자에 변이가 있어 평생 암에 걸릴 위험이 크게 높아요.' },
  { id: 'opn1', name: '적록 색각이상', kind: '색각', gene: 'OPN1LW', p: 0.18, price: 800, success: 0.99, life: 0, ethic: 'disability',
    real: '한국 남성의 약 6%',
    desc: '빨간색과 초록색을 잘 구별하지 못해요. 일상생활에 큰 지장은 없지만 일부 직업에는 제한이 있어요.' },
  { id: 'cftr', name: '낭포성 섬유증', kind: '호흡기 질환', gene: 'CFTR', p: 0.07, price: 4000, success: 0.95, life: 8, ethic: 'offtarget',
    real: '유럽계 약 3,000명 중 1명',
    desc: '끈끈한 점액이 폐와 소화기관에 쌓여 숨쉬기가 어려워요. 최근 나온 신약으로 기대수명이 크게 늘었어요.' },
  { id: 'smn1', name: '척수성 근위축증', kind: '지체장애', gene: 'SMN1', p: 0.07, price: 4500, success: 0.94, life: 4, ethic: 'disability',
    real: '약 1만 명 중 1명',
    desc: '운동 신경세포가 줄어 근육이 약해져요. 휠체어로 이동하며 생활해요. 2019년 유전자 치료제(졸겐스마)가 승인됐어요.' }
];

// 윤리 안내 문구 (선택 과정에서 상황에 맞게 등장)
BF.ETHICS = {
  uncertain: { tag: '예측의 불확실성', text: '키와 지능은 수천 개 유전자와 영양·교육·환경이 함께 만들어요. 지금 산 것은 결과가 아니라 "기대치"예요.' },
  consent: { tag: '아이의 동의', text: '이 아이는 자기 얼굴을 고를 기회가 없었어요. 스무 살이 된 아이는 이 선택을 좋아할까요?' },
  gap: { tag: '경제력에 따른 격차', text: '지금까지 고른 항목은 {spent}. 예산 {min}을 받은 사람은 같은 선택을 할 수 없어요.' },
  therapy: { tag: '치료와 향상 사이', text: '병을 막는 편집과 키를 키우는 편집, 둘은 같은 걸까요? 어디까지 허용해야 할까요?' },
  deaf: { tag: '장애는 고쳐야 할 결함일까?', text: '농인 공동체에서는 수어를 하나의 언어이자 문화로 여기기도 해요. 장애가 있는 삶도 충분히 행복할 수 있어요.' },
  disability: { tag: '누가 정상을 정할까?', text: '장애의 어려움은 몸보다 사회의 벽에서 오는 경우가 많아요. 편집할지 말지는 누가 결정해야 할까요?' },
  hejiankui: { tag: '2018년, 허젠쿠이', text: '중국의 과학자 허젠쿠이는 CCR5 유전자를 편집한 쌍둥이를 탄생시켜 세계적인 비판을 받고 징역 3년을 선고받았어요.' },
  offtarget: { tag: '유전자 가위의 실수', text: 'CRISPR 유전자 가위는 엉뚱한 곳을 자르는 "오프타깃" 위험이 있어요. 일부 세포만 편집되는 "모자이크"도 생길 수 있어요.' },
  law: { tag: '우리나라의 법', text: '생명윤리법은 배아·태아에 대한 유전자 치료를 금지하고 있어요. 이 체험은 가상 상황이에요.' },
  natural: { tag: '자연에 맡기기', text: '"자연에 맡기기"는 무료예요. 지금 이 부스에 있는 사람 모두가 그렇게 태어났어요.' }
};

BF.CAREERS = {
  researcher: { name: '생명과학 연구원', outfit: 'labcoat' },
  doctor: { name: '의사', outfit: 'labcoat' },
  developer: { name: '게임 개발자', outfit: 'hoodie' },
  lawyer: { name: '인권 변호사', outfit: 'suit' },
  teacher: { name: '초등학교 선생님', outfit: 'smart' },
  sprinter: { name: '육상 단거리 선수', outfit: 'track' },
  marathoner: { name: '마라톤 선수', outfit: 'track' },
  musician: { name: '작곡가', outfit: 'turtleneck' },
  designer: { name: '디자이너', outfit: 'turtleneck' },
  chef: { name: '요리사', outfit: 'apron' },
  nurse: { name: '간호사', outfit: 'scrubs' },
  firefighter: { name: '소방관', outfit: 'fire' },
  photographer: { name: '사진작가', outfit: 'hoodie' },
  webtoon: { name: '웹툰 작가', outfit: 'hoodie' },
  carpenter: { name: '가구 목수', outfit: 'apron' },
  farmer: { name: '스마트팜 농부', outfit: 'apron' },
  translator: { name: '수어 통역사', outfit: 'smart' }
};

BF.BABY_NAMES = ['하늘', '다온', '라온', '이안', '지안', '서진', '은우', '시우', '하람', '해솔', '윤슬', '로아', '가온', '나래', '새봄', '도담', '온유', '여름', '보리', '한결', '단우', '리안', '소울', '아름'];

BF.DEFAULTS = {
  presets: [3000, 5000, 7000, 10000, 15000, 20000, 30000, 50000], // 룰렛 칸 금액 (만원)
  timer: 300,          // 조합 시간 (초) — 5분
  guarantee: false,    // 기본은 강제 발견 없음. 운영자 설정에서 켤 수 있습니다.
  screeningVersion: 2, // 새 확률 적용 시 이전의 강제 발견 기본값을 해제
  baseUrl: '',         // 결과 페이지 주소 (비우면 현재 주소 사용)
  label: '50x30',      // 라벨 크기 (mm)
  sound: true,
  speed: 1             // 성장 애니메이션 기본 속도
};
