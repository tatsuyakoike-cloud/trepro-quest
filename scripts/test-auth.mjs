/** 認証ロジックの動作確認（API不要） */

const DEMO_PROFILES = [
  { email: 'support-team@tre-pro.co.jp', role: 'admin', member_slug: null },
  { email: 'admin@trepro.jp', role: 'admin', member_slug: null },
  { email: 'asai@tre-pro.co.jp', role: 'member', member_slug: 'asai' },
  { email: 'nakaguki@tre-pro.co.jp', role: 'member', member_slug: 'nakakuki' },
]

const PASSWORDS = {
  'support-team@tre-pro.co.jp': 'trepro2026',
  'admin@trepro.jp': 'trepro2026',
  'asai@tre-pro.co.jp': 'asai2026',
  'nakaguki@tre-pro.co.jp': 'nakakuki2026',
}

function normalizeEmail(email) {
  return email.trim().toLowerCase()
}

function validate(email, password) {
  const profile = DEMO_PROFILES.find(
    (p) => normalizeEmail(p.email) === normalizeEmail(email),
  )
  if (!profile) return { ok: false, error: '登録されていないメールアドレスです' }
  if (password !== PASSWORDS[normalizeEmail(email)]) {
    return { ok: false, error: 'パスワードが正しくありません' }
  }
  return { ok: true, profile }
}

let passed = 0
let failed = 0

function assert(name, condition) {
  if (condition) {
    passed++
    console.log(`✓ ${name}`)
  } else {
    failed++
    console.error(`✗ ${name}`)
  }
}

assert('管理者ログイン', validate('support-team@tre-pro.co.jp', 'trepro2026').ok)
assert('旧管理者メール', validate('admin@trepro.jp', 'trepro2026').ok)
assert('浅井さんログイン', validate('asai@tre-pro.co.jp', 'asai2026').ok)
assert('中岫さんログイン', validate('nakaguki@tre-pro.co.jp', 'nakakuki2026').ok)
assert('大文字小文字無視', validate('Support-Team@tre-pro.co.jp', 'trepro2026').ok)
assert(
  'パスワード誤り',
  !validate('support-team@tre-pro.co.jp', 'wrong').ok,
)
assert(
  '未登録メール',
  validate('unknown@example.com', 'x').error === '登録されていないメールアドレスです',
)

console.log(`\n結果: ${passed} 成功, ${failed} 失敗`)
process.exit(failed > 0 ? 1 : 0)
