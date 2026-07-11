/**
 * トレプロクエスト — スプレッドシート連携 API
 *
 * セットアップ:
 * 1. https://docs.google.com/spreadsheets/d/12qHhMQB7DsYZauA64slzs3ABaMcJYMPWivMYgWzqESM/edit を開く
 * 2. 拡張機能 → Apps Script
 * 3. このコードを貼り付けて保存
 * 4. 関数 setupMasterData を選択して「実行」（初回のみ・マスターデータ投入）
 * 5. デプロイ → 新しいデプロイ → ウェブアプリ
 *    - 実行ユーザー: 自分
 *    - アクセス: 全員
 * 6. 関数 installTriggers を実行（シート直接編集時のダッシュボード自動更新）
 * 7. 公開URLを public/config.json の syncApiUrl に設定
 */

const SPREADSHEET_ID = '12qHhMQB7DsYZauA64slzs3ABaMcJYMPWivMYgWzqESM';

const SHEETS = {
  users: 'ユーザー',
  members: 'メンバー',
  missions: 'ミッション',
  progress: '進捗',
  titles: '称号',
  dashboard: 'ダッシュボード',
};

function doGet(e) {
  try {
    const action = (e && e.parameter && e.parameter.action) || 'ping';
    if (action === 'fetchAll') {
      return jsonResponse_({ ok: true, data: fetchAllData_(), updatedAt: nowIso_() });
    }
    return jsonResponse_({ ok: true, service: 'trepro-quest', updatedAt: nowIso_() });
  } catch (error) {
    return jsonResponse_({ ok: false, message: String(error), updatedAt: nowIso_() });
  }
}

function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents);
    if (body.action === 'login') {
      return jsonResponse_(login_(body.email, body.password));
    }
    if (body.action === 'updateProgress') {
      return jsonResponse_(updateProgress_(body));
    }
    throw new Error('不明な action: ' + body.action);
  } catch (error) {
    return jsonResponse_({ ok: false, message: String(error), updatedAt: nowIso_() });
  }
}

/** 初回セットアップ: マスターシートとデータを作成 */
function setupMasterData() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  ensureSheet_(ss, SHEETS.users, [
    ['id', 'name', 'email', 'password', 'role', 'member_slug', 'active'],
    ['admin-001', '管理者', 'support-team@tre-pro.co.jp', 'trepro2026', 'admin', '', 'TRUE'],
    ['member-asai', '浅井さん', 'asai@tre-pro.co.jp', 'asai2026', 'member', 'asai', 'TRUE'],
    ['member-nakakuki', '中岫さん', 'nakaguki@tre-pro.co.jp', 'nakakuki2026', 'member', 'nakakuki', 'TRUE'],
  ]);

  ensureSheet_(ss, SHEETS.members, [
    ['id', 'name', 'slug', 'title', 'active'],
    ['11111111-1111-1111-1111-111111111101', '浅井さん', 'asai', '旅立ち前の新人', 'TRUE'],
    ['11111111-1111-1111-1111-111111111102', '中岫さん', 'nakakuki', '旅立ち前の新人', 'TRUE'],
  ]);

  ensureSheet_(ss, SHEETS.titles, [
    ['level', 'title'],
    ['0', '旅立ち前の新人'],
    ['1', '見習い冒険者'],
    ['2', '商談のたまご'],
    ['3', '提案の戦士'],
    ['4', '現場の実践者'],
    ['5', '即戦力候補'],
    ['6', 'トレプロ勇者'],
  ]);

  ensureSheet_(ss, SHEETS.missions, [
    ['id', 'tab', 'mission_group', 'step_number', 'level_name', 'title', 'description', 'reviewer_name', 'pass_criteria', 'sort_order', 'active'],
    ['m-001', '商談ロープレ', '商談ロープレのレベル上げ', '1', 'Lv.1', '基本営業ロープレ', 'サービス理解・言葉遣い・商談の基本構成を身につける', '小池', 'サービス内容を正確に説明できる|敬語や言葉遣いに大きな問題がない|商談の基本的な流れを再現できる|次回アクションを提示できる', '1', 'TRUE'],
    ['m-002', '商談ロープレ', '商談ロープレのレベル上げ', '2', 'Lv.2', '実践営業ロープレ', '電話アポ・メール送付・日程調整・商談実施を一連で実施する', '橋口さん', 'アポ取得から商談までを一連で実施できる|クライアント役からの質問に対応できる|商談後のメールを作成できる|次回アクションと日程を握れる', '2', 'TRUE'],
    ['m-003', '商談ロープレ', '商談ロープレのレベル上げ', '3', 'Lv.3', '最終営業ロープレ', '顧客課題の整理・経営者目線への対応・提案と質疑応答', '金山さん', '顧客課題に応じて提案を変更できる|経営者目線の質問に回答できる|商談を自力で完遂できる|金山さんから最終合格をもらう', '3', 'TRUE'],
    ['m-004', '資料作成', '事例一覧', '1', 'Lv.1', '最新事例収集', 'MMチームへヒアリングし、建設・介護・営業など主要業界の最新事例を収集・整理する', '-', 'MMチームへの確認が完了している|最新事例が反映されている|第三者が営業で再利用できる|情報の出典が確認できる', '4', 'TRUE'],
    ['m-005', '資料作成', '競合調査', '2', 'Lv.2', '競合・業界調査資料更新', '主要競合の価格・サービス・強み・弱みを比較し、業界の市場構造を整理する', '-', '主要競合を整理している|価格・サービス・強み・弱みを比較している|業界の市場構造を整理している|情報源が記載されている|AIの出力内容を人間が確認している|営業で使用できる示唆がある', '5', 'TRUE'],
    ['m-006', '資料作成', '提案資料のレベル上げ', '3', 'Lv.3', '最新サービス資料の提案反映', '最新サービス内容を理解し、顧客課題に応じた提案資料を作成する', '-', '最新サービス内容を理解している|顧客課題に応じて提案内容を変更している|事例・競合調査の内容を活用している|レビュー指摘を反映している|商談で使用できる状態になっている', '6', 'TRUE'],
  ]);

  const progressRows = [['id', 'member_slug', 'mission_id', 'status', 'result', 'executed_at', 'feedback', 'next_action', 'due_date', 'tldb_url', 'updated_by', 'updated_at']];
  ['asai', 'nakakuki'].forEach(function (slug) {
    ['m-001', 'm-002', 'm-003', 'm-004', 'm-005', 'm-006'].forEach(function (mid) {
      progressRows.push([
        slug + '-' + mid,
        slug,
        mid,
        '未着手',
        '未審査',
        '',
        '',
        '',
        '',
        '',
        '',
        nowIso_(),
      ]);
    });
  });
  ensureSheet_(ss, SHEETS.progress, progressRows);

  const dash = ss.getSheetByName(SHEETS.dashboard) || ss.getSheets()[0];
  if (dash) {
    dash.setName(SHEETS.dashboard);
    dash.clear();
    dash.getRange(1, 1, 4, 6).setValues([
      ['メンバー', '総合レベル', '総合進捗', '商談ロープレ', '資料作成', '要フォロー'],
      ['浅井さん', 'Lv.0', '0%', '0%', '0%', '0'],
      ['中岫さん', 'Lv.0', '0%', '0%', '0%', '0'],
      ['※ 進捗更新時に自動再計算されます', '', '', '', '', ''],
    ]);
  }

  SpreadsheetApp.flush();
  installTriggers();
  Logger.log('setupMasterData 完了');
}

/**
 * スプレッドシート上で進捗を直接編集したときにダッシュボードを再計算
 * （コンテナバインドスクリプトとして設置した場合のシンプルトリガー）
 */
function onEdit(e) {
  handleSheetEdit_(e);
}

/** 進捗シートの直接編集を検知してダッシュボード・称号を再計算 */
function onEditProgress_(e) {
  handleSheetEdit_(e);
}

function handleSheetEdit_(e) {
  if (!e || !e.range) return;
  var sheetName = e.range.getSheet().getName();
  if (sheetName === SHEETS.progress) {
    updateDashboard_();
    updateMemberTitles_();
  }
}

/** シート直接編集時の自動再計算トリガーを設置（初回 or 再実行） */
function installTriggers() {
  var handler = 'onEditProgress_';
  ScriptApp.getProjectTriggers().forEach(function (trigger) {
    if (trigger.getHandlerFunction() === handler) {
      ScriptApp.deleteTrigger(trigger);
    }
  });
  ScriptApp.newTrigger(handler)
    .forSpreadsheet(SPREADSHEET_ID)
    .onEdit()
    .create();
  Logger.log('installTriggers 完了');
}

function fetchAllData_() {
  return {
    members: readMembers_(),
    missions: readMissions_(),
    progresses: readProgresses_(),
    titles: readTitles_(),
  };
}

function login_(email, password) {
  const sheet = getSheet_(SHEETS.users);
  const rows = sheet.getDataRange().getValues();
  const headers = rows[0].map(String);
  const emailIdx = headers.indexOf('email');
  const passIdx = headers.indexOf('password');

  for (let i = 1; i < rows.length; i++) {
    if (String(rows[i][emailIdx]).trim().toLowerCase() === String(email).trim().toLowerCase()) {
      if (String(rows[i][passIdx]) !== String(password)) {
        return { ok: false, message: 'パスワードが正しくありません' };
      }
      const profile = rowToObject_(headers, rows[i]);
      delete profile.password;
      profile.created_at = nowIso_();
      profile.updated_at = nowIso_();
      return { ok: true, profile: profile };
    }
  }
  return { ok: false, message: '登録されていないメールアドレスです' };
}

function updateProgress_(body) {
  const sheet = getSheet_(SHEETS.progress);
  const rows = sheet.getDataRange().getValues();
  const headers = rows[0].map(String);
  const idIdx = headers.indexOf('id');
  const rowIndex = rows.findIndex(function (row, i) {
    return i > 0 && String(row[idIdx]) === String(body.progressId);
  });

  if (rowIndex < 0) throw new Error('進捗が見つかりません');

  const input = body.data || {};
  const fieldMap = {
    status: 'status',
    result: 'result',
    executed_at: 'executed_at',
    feedback: 'feedback',
    next_action: 'next_action',
    due_date: 'due_date',
    tldb_url: 'tldb_url',
    updated_by: 'updated_by',
  };

  Object.keys(fieldMap).forEach(function (key) {
    if (input[key] !== undefined) {
      const col = headers.indexOf(fieldMap[key]);
      if (col >= 0) rows[rowIndex][col] = input[key] === null ? '' : input[key];
    }
  });

  const updatedAtCol = headers.indexOf('updated_at');
  if (updatedAtCol >= 0) rows[rowIndex][updatedAtCol] = nowIso_();

  sheet.getRange(1, 1, rows.length, headers.length).setValues(rows);
  updateDashboard_();
  updateMemberTitles_();

  const members = readMembers_();
  const memberBySlug = {};
  members.forEach(function (m) { memberBySlug[m.slug] = m.id; });

  const updated = rowToObject_(headers, rows[rowIndex]);
  return { ok: true, progress: mapProgressRow_(updated, memberBySlug), updatedAt: nowIso_() };
}

function readMembers_() {
  return readSheetObjects_(SHEETS.members).map(function (row) {
    return {
      id: row.id,
      name: row.name,
      slug: row.slug,
      title: row.title || '旅立ち前の新人',
      active: String(row.active).toUpperCase() === 'TRUE',
      created_at: nowIso_(),
      updated_at: nowIso_(),
    };
  }).filter(function (m) { return m.active; });
}

function readMissions_() {
  return readSheetObjects_(SHEETS.missions).map(function (row) {
    return {
      id: row.id,
      tab: row.tab || '商談ロープレ',
      mission_group: row.mission_group,
      step_number: Number(row.step_number),
      level_name: row.level_name,
      title: row.title,
      description: row.description,
      reviewer_name: row.reviewer_name || '-',
      pass_criteria: row.pass_criteria || '',
      sort_order: Number(row.sort_order),
      active: String(row.active).toUpperCase() === 'TRUE',
      created_at: nowIso_(),
      updated_at: nowIso_(),
    };
  }).filter(function (m) { return m.active; }).sort(function (a, b) { return a.sort_order - b.sort_order; });
}

function readProgresses_() {
  const members = readMembers_();
  const memberBySlug = {};
  members.forEach(function (m) { memberBySlug[m.slug] = m.id; });

  return readSheetObjects_(SHEETS.progress).map(function (row) {
    return mapProgressRow_(row, memberBySlug);
  });
}

function mapProgressRow_(row, memberBySlug) {
  const slug = row.member_slug;
  const memberId = (memberBySlug && memberBySlug[slug]) || slug;
  return {
    id: row.id,
    member_id: memberId,
    member_slug: slug,
    mission_id: row.mission_id,
    status: row.status || '未着手',
    result: row.result || '未審査',
    executed_at: row.executed_at || null,
    feedback: row.feedback || '',
    next_action: row.next_action || '',
    due_date: row.due_date || null,
    tldb_url: row.tldb_url || '',
    updated_by: row.updated_by || null,
    created_at: row.updated_at || nowIso_(),
    updated_at: row.updated_at || nowIso_(),
  };
}

function readTitles_() {
  return readSheetObjects_(SHEETS.titles);
}

function updateMemberTitles_() {
  const membersSheet = getSheet_(SHEETS.members);
  const members = readSheetObjects_(SHEETS.members);
  const progresses = readProgresses_();
  const titles = readTitles_();
  const titleMap = {};
  titles.forEach(function (t) { titleMap[Number(t.level)] = t.title; });

  members.forEach(function (member, i) {
    const passed = progresses.filter(function (p) {
      return p.member_slug === member.slug && p.result === '合格';
    }).length;
    const title = titleMap[Math.min(passed, 6)] || titleMap[0];
    membersSheet.getRange(i + 2, 4).setValue(title);
  });
}

function updateDashboard_() {
  const sheet = getSheet_(SHEETS.dashboard);
  if (!sheet) return;

  const members = readMembers_();
  const missions = readMissions_();
  const progresses = readProgresses_();

  members.forEach(function (member, idx) {
    const memberProgress = progresses.filter(function (p) { return p.member_slug === member.slug; });
    const passed = memberProgress.filter(function (p) { return p.result === '合格'; }).length;
    const level = passed >= 6 ? 'Lv.MAX' : 'Lv.' + passed;
    const rate = Math.round((passed / 6) * 100) + '%';

    const tabs = {};
    missions.forEach(function (m) {
      const tab = m.tab || '商談ロープレ';
      if (!tabs[tab]) tabs[tab] = { total: 0, passed: 0 };
      tabs[tab].total += 1;
      const prog = memberProgress.find(function (p) { return p.mission_id === m.id; });
      if (prog && prog.result === '合格') tabs[tab].passed += 1;
    });

    function tabRate(name) {
      const t = tabs[name];
      if (!t || t.total === 0) return '0%';
      return Math.round((t.passed / t.total) * 100) + '%';
    }

    const follow = memberProgress.filter(function (p) {
      return p.due_date && p.result !== '合格' && p.status !== '完了' && new Date(p.due_date) < new Date();
    }).length;

    sheet.getRange(idx + 2, 1, 1, 6).setValues([[
      member.name,
      level,
      rate,
      tabRate('商談ロープレ'),
      tabRate('資料作成'),
      follow,
    ]]);
  });
}

function ensureSheet_(ss, name, rows) {
  let sheet = ss.getSheetByName(name);
  if (!sheet) sheet = ss.insertSheet(name);
  sheet.clear();
  sheet.getRange(1, 1, rows.length, rows[0].length).setValues(rows);
  sheet.getRange(1, 1, 1, rows[0].length).setFontWeight('bold');
  return sheet;
}

function getSheet_(name) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(name);
  if (!sheet) throw new Error('シート「' + name + '」が見つかりません。setupMasterData を実行してください。');
  return sheet;
}

function readSheetObjects_(name) {
  const sheet = getSheet_(name);
  const values = sheet.getDataRange().getValues();
  if (values.length < 2) return [];
  const headers = values[0].map(String);
  const result = [];
  for (let i = 1; i < values.length; i++) {
    if (!String(values[i][0] || '').trim()) continue;
    result.push(rowToObject_(headers, values[i]));
  }
  return result;
}

function rowToObject_(headers, row) {
  const obj = {};
  headers.forEach(function (h, i) { obj[h] = row[i]; });
  return obj;
}

function nowIso_() {
  return new Date().toISOString();
}

function jsonResponse_(payload) {
  return ContentService.createTextOutput(JSON.stringify(payload)).setMimeType(ContentService.MimeType.JSON);
}
