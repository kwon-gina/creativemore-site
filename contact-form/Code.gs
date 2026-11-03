/**
 * 더씨앤엠 홈페이지 문의 접수 (Google Apps Script 웹 앱)
 *
 * 흐름: 홈페이지 Contact 폼 → 이 웹 앱(doPost) → TO · CC 주소로 정리된 메일 발송 (+ 선택: 구글 시트 기록)
 * 방문자 메일앱 불필요, 회사 구글 계정에서 발송
 *
 * 설정
 * * TO          접수 메일 받을 주소
 * * CC          함께 받을 주소 (쉼표 구분, 없으면 '')
 * * SHEET_ID    접수 기록용 구글 시트 ID (없으면 '' 로 두면 기록 생략)
 */
const TO = 'kwon@creativemore.co.kr';
const CC = 'cha@creativemore.co.kr';
const SHEET_ID = '';
const SENDER_NAME = '더씨앤엠 홈페이지';
const TZ = 'Asia/Seoul';

const LIMIT = { name: 60, company: 80, phone: 40, email: 120, services: 200, schedule: 120, message: 5000, page: 300 };

function doPost(e) {
  const p = (e && e.parameter) || {};
  if (p.website) { return json_({ ok: true }); }                 // 숨김 칸(honeypot)에 값이 있으면 봇, 조용히 무시

  const f = {};
  Object.keys(LIMIT).forEach(function (k) { f[k] = clean_(p[k], LIMIT[k]); });
  f.message = clean_(p.message, LIMIT.message, true);
  if (!f.name || !f.message || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email)) {
    return json_({ ok: false, error: 'invalid' });
  }

  const cache = CacheService.getScriptCache();
  const sig = 'dup_' + hash_(f.email + '|' + f.message.slice(0, 300));
  if (cache.get(sig)) { return json_({ ok: true, dup: true }); }  // 같은 내용 연속 전송(더블 클릭 등) 1회만 발송
  cache.put(sig, '1', 120);
  if (!burstOk_(cache)) { return json_({ ok: false, error: 'busy' }); }

  const when = Utilities.formatDate(new Date(), TZ, 'yyyy.MM.dd HH:mm');
  const who = f.company ? f.company + ' · ' + f.name : f.name;
  const subject = '[홈페이지 문의] ' + who + (f.services ? ' · ' + f.services : '');
  const rows = [
    ['문의 분야', f.services || '선택 안 함'],
    ['이름', f.name],
    ['회사 · 브랜드', f.company || '미기재'],
    ['연락처', f.phone || '미기재'],
    ['이메일', f.email],
    ['희망 일정', f.schedule || '미기재'],
    ['문의 내용', f.message],
    ['접수 시각', when],
    ['접수 페이지', f.page || 'www.creativemore.co.kr/contact/']
  ];

  const mail = {
    to: TO,
    replyTo: f.email,
    name: SENDER_NAME,
    subject: subject,
    body: rows.map(function (r) { return '■ ' + r[0] + '\n' + r[1]; }).join('\n\n') + '\n\n회신 버튼을 누르면 문의자(' + f.email + ')에게 바로 답장',
    htmlBody: html_(rows, f)
  };
  if (CC) { mail.cc = CC; }
  MailApp.sendEmail(mail);

  if (SHEET_ID) {
    try {
      const sh = SpreadsheetApp.openById(SHEET_ID).getSheets()[0];
      if (sh.getLastRow() === 0) { sh.appendRow(['접수 시각', '문의 분야', '이름', '회사 · 브랜드', '연락처', '이메일', '희망 일정', '문의 내용', '접수 페이지']); }
      sh.appendRow([when, f.services, f.name, f.company, f.phone, f.email, f.schedule, f.message, f.page]);
    } catch (err) { console.error('sheet log failed', err); }
  }
  return json_({ ok: true });
}

/* 배포 확인용: 웹 앱 주소를 브라우저로 열면 {"ok":true,...} 표시 */
function doGet() {
  return json_({ ok: true, service: 'cnm-contact', to: TO.replace(/^(.).*(@.*)$/, '$1***$2') });
}

/* 권한 승인 + 발송 테스트용: 편집기에서 이 함수 선택 후 실행 */
function testSend() {
  const r = doPost({ parameter: {
    services: '공간 디자인, 행사', name: '테스트', company: '더씨앤엠', phone: '02-3452-1253',
    email: TO, schedule: '테스트 발송', message: '홈페이지 문의 접수 테스트\n줄바꿈 확인', page: 'apps-script-test'
  } });
  console.log(r.getContent());
}

function html_(rows, f) {
  const font = "Pretendard,-apple-system,BlinkMacSystemFont,'Apple SD Gothic Neo','Malgun Gothic',sans-serif";
  const tr = rows.map(function (r) {
    const v = esc_(r[1]).replace(/\n/g, '<br>');
    return '<tr><th style="text-align:left;vertical-align:top;width:110px;padding:12px 14px;border-bottom:1px solid #E4DCD0;font-size:13px;color:#6B6258;font-weight:700;white-space:nowrap">' + esc_(r[0]) + '</th>'
      + '<td style="padding:12px 14px;border-bottom:1px solid #E4DCD0;font-size:15px;color:#080808;line-height:1.6;word-break:keep-all">' + v + '</td></tr>';
  }).join('');
  return '<div style="font-family:' + font + ';background:#EEE4D7;padding:24px">'
    + '<div style="max-width:640px;margin:0 auto;background:#FFFDF9;border:1.5px solid #080808;border-radius:12px;overflow:hidden">'
    + '<div style="padding:18px 20px;background:#080808;color:#FFFDF9;font-size:17px;font-weight:800">홈페이지 프로젝트 문의</div>'
    + '<table role="presentation" cellspacing="0" cellpadding="0" style="width:100%;border-collapse:collapse">' + tr + '</table>'
    + '<div style="padding:14px 20px;font-size:13px;color:#6B6258">회신 버튼을 누르면 문의자(' + esc_(f.email) + ')에게 바로 답장</div>'
    + '</div></div>';
}

function clean_(v, max, multiline) {
  let s = String(v === undefined || v === null ? '' : v).replace(/\r\n?/g, '\n');
  s = multiline ? s.replace(/[\u0000-\u0009\u000B-\u001F\u007F]/g, '') : s.replace(/[\u0000-\u001F\u007F]+/g, ' ');
  return s.trim().slice(0, max);
}

function esc_(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function hash_(s) {
  const d = Utilities.computeDigest(Utilities.DigestAlgorithm.MD5, s, Utilities.Charset.UTF_8);
  return d.map(function (b) { return ((b + 256) % 256).toString(16).padStart(2, '0'); }).join('');
}

/* 10분에 30건 넘게 들어오면 잠시 차단 (스팸 폭주 방지) */
function burstOk_(cache) {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(5000)) { return true; }
  try {
    const n = Number(cache.get('burst') || 0) + 1;
    cache.put('burst', String(n), 600);
    return n <= 30;
  } finally { lock.releaseLock(); }
}

function json_(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}
