// カテゴリ・学習ガイド・公式リンクの定義(日本語 / 英語)。記事の本文は src/content/articles/ にある。

export const categories = [
  { id: 'frontend', icon: '</>', short: 'Frontend', name: { ja: 'フロントエンド', en: 'Frontend' } },
  { id: 'backend', icon: '{ }', short: 'Backend', name: { ja: 'バックエンド', en: 'Backend' } },
  { id: 'infra', icon: '▤', short: 'Infrastructure', name: { ja: 'インフラ', en: 'Infrastructure' } },
  { id: 'practice', icon: '⌘', short: 'Dev Practices', name: { ja: '開発手法・ツール', en: 'Dev Practices & Tools' } },
  { id: 'cs', icon: '∑', short: 'CS & Math', name: { ja: 'CS・数学', en: 'CS & Math' } },
  { id: 'ai', icon: '✳', short: 'AI & Data Science', name: { ja: 'AI・データサイエンス', en: 'AI & Data Science' } }
];

export const guides = [
  {
    icon: '✳',
    title: { ja: 'Claude Codeを使いこなす', en: 'Get the most out of Claude Code' },
    description: {
      ja: '始め方、CLAUDE.md、権限、日常のワークフローを順に。',
      en: 'Getting started, CLAUDE.md, permissions and everyday workflows, in order.'
    },
    ids: ['claude-code-start', 'claude-code-claude-md', 'claude-code-permissions', 'claude-code-workflows']
  }
];

export const resources = [
  {
    name: 'Claude Code Docs', mark: 'CC', url: 'https://code.claude.com/docs/en/overview',
    label: { ja: 'Claude Codeを調べる', en: 'Look up Claude Code' },
    description: { ja: 'インストール、設定、権限、ワークフローの公式ドキュメント。', en: 'Official documentation on installation, settings, permissions and workflows.' }
  },
  {
    name: 'MDN Web Docs', mark: 'M', url: 'https://developer.mozilla.org/ja/docs/Learn_web_development/Extensions/Server-side/First_steps/Client-Server_overview',
    label: { ja: 'Webの基本を調べる', en: 'Look up web basics' },
    description: { ja: 'HTMLやHTTPを学ぶ入口に。クライアントとサーバーの関係から。', en: 'A starting point for HTML and HTTP, beginning with how clients and servers relate.' }
  },
  {
    name: 'Git Documentation', mark: 'git', url: 'https://git-scm.com/docs/git-diff',
    label: { ja: 'コマンドを確かめる', en: 'Check a command' },
    description: { ja: 'git diffの使い方とオプションを公式リファレンスで確認。', en: 'See how git diff works and what its options do in the official reference.' }
  },
  {
    name: 'Docker Docs', mark: '▤', url: 'https://docs.docker.com/get-started/docker-concepts/the-basics/what-is-a-container/',
    label: { ja: 'コンテナを理解する', en: 'Understand containers' },
    description: { ja: 'コンテナの基本的な考え方を学べる公式ドキュメント。', en: 'Official documentation on the basic idea of a container.' }
  }
];

// アプリ(https://paibot.app)にあるツール。名前と説明は、アプリのメッセージファイルと同じ。
// ツールはアプリに任せて、このサイトでは作らない。
export const appTools = [
  { slug: "json", title: { ja: "JSON整形", en: "JSON Formatter" }, description: { ja: "JSONを整形・圧縮したり、妥当性を確認できます。", en: "Format, minify, and validate JSON." } },
  { slug: "base64", title: { ja: "Base64変換", en: "Base64 Converter" }, description: { ja: "テキストとBase64を相互に変換できます。", en: "Convert text to and from Base64." } },
  { slug: "urlencode", title: { ja: "URLエンコード変換", en: "URL Encoder" }, description: { ja: "テキストとURLエンコード文字列を相互に変換できます。", en: "Convert text to and from URL-encoded strings." } },
  { slug: "wc", title: { ja: "文字数カウント", en: "Character Count" }, description: { ja: "入力したテキストの文字数を数えます。", en: "Count the characters in the text you enter." } },
  { slug: "llm-memory", title: { ja: "ローカルLLMのメモリ見積もり", en: "Local LLM Memory Estimator" }, description: { ja: "モデルのパラメータ数と量子化のビット数から、重みに必要なメモリを見積もり、手元のメモリに収まるか確かめます。", en: "Estimate the memory a model's weights need from its parameter count and quantization bits, and check whether it fits in your memory." } },
  { slug: "cidr", title: { ja: "CIDR計算機", en: "CIDR Calculator" }, description: { ja: "IPv4アドレスとCIDR表記から、ネットワークアドレス・ブロードキャスト・ホスト数などを計算します。", en: "Calculate the network address, broadcast address, host range and more from an IPv4 address in CIDR notation." } },
  { slug: "ip", title: { ja: "IPアドレス確認", en: "IP Address Check" }, description: { ja: "いま使っているIPv4・IPv6アドレスと、回線の提供元、推定の場所など、サイトから見える接続情報を確認できます。", en: "Check the IPv4 and IPv6 addresses your browser is using now, plus connection details this site can see, such as the network provider and estimated location." } },
  { slug: "domain", title: { ja: "ドメイン確認(WHOIS)", en: "Domain Lookup (WHOIS)" }, description: { ja: "ドメインが空いているか(登録済みか)と、登録者・登録日・有効期限などを確認できます。", en: "Check whether a domain is available or already registered, plus its registrant, registration date and expiry." } },
  { slug: "site-check", title: { ja: "Webサイト稼働チェック", en: "Website Status Check" }, description: { ja: "URLを入れると、サイトが応答しているか、ステータスコード・応答時間・リダイレクトの経路を確認できます。", en: "Enter a URL to see whether the site responds, with its status code, response time and redirect chain." } },
];
