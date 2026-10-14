---
title: "\"👨‍👩‍👧\" の長さは、JavaScriptで8、Pythonで5、Rustで18、Swiftで1:文字数を数えるだけなのに"
description: "同じ文字列なのに、言語ごとに「長さ」が違う。𠮷野家、国旗、家族の絵文字を、4つの言語で実際に数えて、理由と、壊れない扱い方を確かめた。"
category: "cs"
tags: ["Unicode","文字列","JavaScript","Python"]
minutes: 9
type: "入門ガイド"
level: "どれか1つの言語が読めれば十分"
takeaway: "「文字数」には、バイト、UTF-16の単位、コードポイント、見た目の1文字、の4通りの数え方があります。言語ごとの標準の「長さ」は、どれを数えるかが違います。4言語で実測して確かめました。"
order: 7
sources:
  - { title: "MDN — String: length", url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/length" }
  - { title: "Unicode® Standard Annex #29: Unicode Text Segmentation", url: "https://www.unicode.org/reports/tr29/" }
  - { title: "Python — Built-in Types: str", url: "https://docs.python.org/3/library/stdtypes.html#str" }
  - { title: "The Swift Programming Language — Strings and Characters", url: "https://docs.swift.org/swift-book/documentation/the-swift-programming-language/stringsandcharacters/" }
---

## 先に結果

次の絵文字、👨‍👩‍👧 は、見た目は1文字です。この長さを、各言語の標準の方法で数えると、答えがばらばらになります。

<figure class="diagram"><svg viewBox="0 0 400 410" role="img" aria-labelledby="ul-t"><title id="ul-t">家族の絵文字の長さは、数え方で変わる</title><defs><marker id="ul-a" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0L10 5L0 10z" class="d-arrowhead"/></marker></defs><text x="200" y="52" text-anchor="middle" style="font-size:38px">👨‍👩‍👧</text><text x="200" y="74" class="d-small" text-anchor="middle">見た目は1文字</text><text x="12" y="92" class="d-small d-strong">コードポイント(5つ)</text><rect x="12" y="98" width="68" height="34" rx="6" class="d-accent-soft"/><text x="46" y="123" text-anchor="middle" style="font-size:20px">👨</text><rect x="89" y="98" width="68" height="34" rx="6" class="d-box"/><text x="123" y="120" class="d-small d-mono" text-anchor="middle">ZWJ</text><rect x="166" y="98" width="68" height="34" rx="6" class="d-accent-soft"/><text x="200" y="123" text-anchor="middle" style="font-size:20px">👩</text><rect x="243" y="98" width="68" height="34" rx="6" class="d-box"/><text x="277" y="120" class="d-small d-mono" text-anchor="middle">ZWJ</text><rect x="320" y="98" width="68" height="34" rx="6" class="d-accent-soft"/><text x="354" y="123" text-anchor="middle" style="font-size:20px">👧</text><text x="12" y="158" class="d-small d-strong">UTF-16(8単位)</text><rect x="12.0" y="164" width="92.0" height="30" rx="4" class="d-seg-tool" fill-opacity="1"/><text x="58" y="184" class="d-white" text-anchor="middle">2</text><rect x="106.0" y="164" width="45.0" height="30" rx="4" class="d-seg-tool" fill-opacity="0.55"/><text x="128.5" y="184" class="d-white" text-anchor="middle">1</text><rect x="153.0" y="164" width="92.0" height="30" rx="4" class="d-seg-tool" fill-opacity="1"/><text x="199" y="184" class="d-white" text-anchor="middle">2</text><rect x="247.0" y="164" width="45.0" height="30" rx="4" class="d-seg-tool" fill-opacity="0.55"/><text x="269.5" y="184" class="d-white" text-anchor="middle">1</text><rect x="294.0" y="164" width="92.0" height="30" rx="4" class="d-seg-tool" fill-opacity="1"/><text x="340" y="184" class="d-white" text-anchor="middle">2</text><text x="12" y="220" class="d-small d-strong">UTF-8(18バイト)</text><rect x="12.0" y="226" width="81.6" height="30" rx="4" class="d-seg-out" fill-opacity="1"/><text x="52.77777777777778" y="246" class="d-white" text-anchor="middle">4</text><rect x="95.6" y="226" width="60.7" height="30" rx="4" class="d-seg-out" fill-opacity="0.55"/><text x="125.88888888888889" y="246" class="d-white" text-anchor="middle">3</text><rect x="158.2" y="226" width="81.6" height="30" rx="4" class="d-seg-out" fill-opacity="1"/><text x="199" y="246" class="d-white" text-anchor="middle">4</text><rect x="241.8" y="226" width="60.7" height="30" rx="4" class="d-seg-out" fill-opacity="0.55"/><text x="272.1111111111111" y="246" class="d-white" text-anchor="middle">3</text><rect x="304.4" y="226" width="81.6" height="30" rx="4" class="d-seg-out" fill-opacity="1"/><text x="345.22222222222223" y="246" class="d-white" text-anchor="middle">4</text><text x="12" y="292" class="d-small d-strong">各言語の「標準の長さ」</text><rect x="12" y="300" width="184" height="44" rx="8" class="d-ok"/><text x="22" y="319" class="d-small d-mono">JavaScript  .length</text><text x="22" y="336" class="d-small">UTF-16の単位</text><text style="font-size:22px" x="186" y="332" class="d-strong" text-anchor="end">8</text><rect x="204" y="300" width="184" height="44" rx="8" class="d-accent-soft"/><text x="214" y="319" class="d-small d-mono">Python  len()</text><text x="214" y="336" class="d-small">コードポイント</text><text style="font-size:22px" x="378" y="332" class="d-strong" text-anchor="end">5</text><rect x="12" y="352" width="184" height="44" rx="8" class="d-warn"/><text x="22" y="371" class="d-small d-mono">Rust  .len()</text><text x="22" y="388" class="d-small">UTF-8のバイト</text><text style="font-size:22px" x="186" y="384" class="d-strong" text-anchor="end">18</text><rect x="204" y="352" width="184" height="44" rx="8" class="d-box"/><text x="214" y="371" class="d-small d-mono">Swift  .count</text><text x="214" y="388" class="d-small">見た目の1文字</text><text style="font-size:22px" x="378" y="384" class="d-strong" text-anchor="end">1</text></svg><figcaption>図1 家族の絵文字は、人には1文字に見える。中身は、コードポイント5つ(ゼロ幅結合子を含む)、UTF-16で8単位、UTF-8で18バイト。言語ごとの標準の「長さ」が、どれを数えるかで、答えが変わる。</figcaption></figure>

|  | JavaScript .length | Python len() | Swift .count | Rust .len() |
| --- | --- | --- | --- | --- |
| 👨‍👩‍👧 | 8 | 5 | 1 | 18 |
| 🇯🇵 | 4 | 2 | 1 | 8 |
| 𠮷野家 | 4 | 3 | 3 | 10 |

どれも間違いではありません。数えているものが違うだけです。同じ「長さ」という名前で、言語ごとに別のものを返しています。この記事は、4つの言語で実際に実行して確かめた結果です。

## 自分の文字で、数えてみる

好きな文字を入れてください。名前、絵文字、国旗でも構いません。4つの数え方の数字が変わり、1文字ずつに割れる様子が見えます。下のスライダーで、先頭から取ったときに、壊れる文字と壊れない文字の違いも確かめられます。計算はすべて、あなたのブラウザの中で行われます。

<div class="widget" data-widget="string-lab"><p class="lab-small">この部品は、JavaScriptが必要です。</p></div>

## 4つの数え方

「文字数」は、次の4つのどれを数えるかで、値が変わります。

- UTF-8のバイト数:ファイルや通信に書き出すときの大きさ。実測では、Rustの.len()がこれを返しました
- UTF-16の単位数:JavaScriptのlengthが数えるもの。MDNは「UTF-16のコードユニットでの長さ」とし、1つのUnicode文字が1つか2つの単位になるので、実際の文字数と合わないことがある、と書いています
- コードポイント:Unicodeの文字1つ1つに付いた番号。Pythonのstrは「Unicodeコードポイントの不変の列」で、len()はその数です(公式ドキュメント)
- 見た目の1文字(書記素クラスタ):人が1文字と感じる単位。UnicodeのUAX #29は、「G」とアクセント記号が、人には1文字でも、実際には2つのコードポイントで表される、という例を挙げています。Swiftのcountは、実測でこれを数えました

## コードで確かめる

同じ9つの文字列を、4つの言語で、4つの数え方で数えました(筆者がNode.js 26.1.0、Python 3.11.5、Swift 6.1、Rust 1.86.0で実行して確認)。4言語の結果は、共通の数え方では、完全に一致しました。Rustは、書記素を標準では数えられないので、3つです。Pythonで書記素を数えるにはregexライブラリを使うので、あらかじめ pip install regex が必要です。

```js tab:"JavaScript" count.mjs
// 同じ文字列を、4つの数え方で数える(JavaScript)
const samples = [
  ['A', 'A'],
  ['あ', 'あ'],
  ['が(1文字で書いたもの)', 'が'],
  ['が(か+濁点で書いたもの)', 'が'],
  ['𠮷', '\u{20BB7}'],
  ['𠮷野家', '\u{20BB7}野家'],
  ['😀', '\u{1F600}'],
  ['🇯🇵', '\u{1F1EF}\u{1F1F5}'],
  ['👨‍👩‍👧', '\u{1F468}‍\u{1F469}‍\u{1F467}'],
];
const segmenter = new Intl.Segmenter('ja', { granularity: 'grapheme' });
for (const [name, s] of samples) {
  const utf8 = Buffer.byteLength(s, 'utf8');
  const utf16 = s.length;                       // JavaScript の length は UTF-16 の単位数
  const codePoints = [...s].length;             // 展開すると、コードポイント単位になる
  const graphemes = [...segmenter.segment(s)].length;
  console.log(`${name}\tutf8=${utf8}\tutf16=${utf16}\tcodepoints=${codePoints}\tgraphemes=${graphemes}`);
}
```

```python tab:"Python" count.py
# 同じ文字列を、4つの数え方で数える(Python)。書記素の数え方だけは、標準ライブラリにないので regex を使う
import regex  # pip install regex

samples = [
    ('A', 'A'),
    ('あ', 'あ'),
    ('が(1文字で書いたもの)', 'が'),
    ('が(か+濁点で書いたもの)', 'が'),
    ('𠮷', '\U00020BB7'),
    ('𠮷野家', '\U00020BB7野家'),
    ('😀', '\U0001F600'),
    ('🇯🇵', '\U0001F1EF\U0001F1F5'),
    ('👨‍👩‍👧', '\U0001F468‍\U0001F469‍\U0001F467'),
]
for name, s in samples:
    utf8 = len(s.encode('utf-8'))
    utf16 = len(s.encode('utf-16-le')) // 2       # UTF-16 の単位数
    codepoints = len(s)                           # Python の len は、コードポイントの数
    graphemes = len(regex.findall(r'\X', s))      # \X は、見た目の1文字
    print(f'{name}\tutf8={utf8}\tutf16={utf16}\tcodepoints={codepoints}\tgraphemes={graphemes}')
```

```swift tab:"Swift" count.swift
// 同じ文字列を、4つの数え方で数える(Swift)
let samples: [(String, String)] = [
    ("A", "A"),
    ("あ", "あ"),
    ("が(1文字で書いたもの)", "\u{304C}"),
    ("が(か+濁点で書いたもの)", "\u{304B}\u{3099}"),
    ("𠮷", "\u{20BB7}"),
    ("𠮷野家", "\u{20BB7}野家"),
    ("😀", "\u{1F600}"),
    ("🇯🇵", "\u{1F1EF}\u{1F1F5}"),
    ("👨‍👩‍👧", "\u{1F468}\u{200D}\u{1F469}\u{200D}\u{1F467}"),
]
for (name, s) in samples {
    // Swift の count は、見た目の1文字(書記素クラスタ)の数
    print("\(name)\tutf8=\(s.utf8.count)\tutf16=\(s.utf16.count)\tcodepoints=\(s.unicodeScalars.count)\tgraphemes=\(s.count)")
}
```

```rust tab:"Rust" count.rs
// 同じ文字列を、3つの数え方で数える(Rust)。書記素は標準ライブラリにないので、ここでは数えない
fn main() {
    let samples = [
        ("A", "A".to_string()),
        ("あ", "あ".to_string()),
        ("が(1文字で書いたもの)", "\u{304C}".to_string()),
        ("が(か+濁点で書いたもの)", "\u{304B}\u{3099}".to_string()),
        ("𠮷", "\u{20BB7}".to_string()),
        ("𠮷野家", "\u{20BB7}野家".to_string()),
        ("😀", "\u{1F600}".to_string()),
        ("🇯🇵", "\u{1F1EF}\u{1F1F5}".to_string()),
        ("👨‍👩‍👧", "\u{1F468}\u{200D}\u{1F469}\u{200D}\u{1F467}".to_string()),
    ];
    for (name, s) in samples.iter() {
        // len() は UTF-8 のバイト数、chars().count() はコードポイントの数
        println!("{}\tutf8={}\tutf16={}\tcodepoints={}", name, s.len(), s.encode_utf16().count(), s.chars().count());
    }
}
```

実行結果は、次のとおりです(JavaScript版。4言語で同じ値になりました)。

| 文字列 | UTF-8のバイト | UTF-16の単位 | コードポイント | 見た目の1文字 |
| --- | --- | --- | --- | --- |
| A | 1 | 1 | 1 | 1 |
| あ | 3 | 1 | 1 | 1 |
| が(1文字で書いたもの) | 3 | 1 | 1 | 1 |
| が(か+濁点で書いたもの) | 6 | 2 | 2 | 1 |
| 𠮷 | 4 | 2 | 1 | 1 |
| 𠮷野家 | 10 | 4 | 3 | 3 |
| 😀 | 4 | 2 | 1 | 1 |
| 🇯🇵 | 8 | 4 | 2 | 1 |
| 👨‍👩‍👧 | 18 | 8 | 5 | 1 |

## 切り詰めると、壊れる

「先頭から何文字だけ表示する」という処理は、数え方を間違えると、文字が壊れます。次のコードは、「長さ」で切り詰めた結果です。

```js tab:"JavaScript" truncate.mjs
const s = 'a\u{20BB7}b';                       // a𠮷b
const cut = s.slice(0, 2);                      // 先頭2単位を取る
console.log(JSON.stringify(cut));               // 𠮷の途中で切れて、文字として壊れる
console.log(cut.isWellFormed());                // false

const family = '\u{1F468}‍\u{1F469}‍\u{1F467}';
console.log([...family].slice(0, 3).join(''));  // 家族ではなく、2人になる
```

```python tab:"Python" truncate.py
family = '\U0001F468‍\U0001F469‍\U0001F467'
print(family[:3])   # 家族ではなく、2人になる
print(family[:1])   # 1人だけになる
```

JavaScriptの実行結果は、次のとおりです。a𠮷b の先頭2単位を取ると、𠮷の途中で切れて、文字として壊れた値(孤立したサロゲート)になります。isWellFormed() は false を返しました。家族の絵文字は、コードポイントで3つ取ると、家族ではなく、2人の絵文字になりました。

```text 実行結果(JavaScript)
"a\ud842"
false
👨‍👩
```

Pythonは、コードポイントで切るので、𠮷の途中で壊れることはありません。ただ、家族の絵文字は、同じように、2人や1人になります。

```text 実行結果(Python)
👨‍👩
👨
```

## 同じ「が」が、2通りある

「が」は、1つのコードポイントでも、「か」と濁点の2つのコードポイントでも書けます。見た目は同じで、中身が違います。比べると、一致しません。

```js tab:"JavaScript" normalize.mjs
const a = 'が';          // が(1つのコードポイント)
const b = 'が';    // か + 濁点(2つのコードポイント)
console.log(a, b);           // 見た目は同じ
console.log(a === b, a.length, b.length);
console.log(a === b.normalize('NFC'));   // 正規化すれば、等しくなる
```

```python tab:"Python" normalize.py
import unicodedata

a = 'が'          # が(1つのコードポイント)
b = 'が'    # か + 濁点(2つのコードポイント)
print(a, b)           # 見た目は同じ
print(a == b, len(a), len(b))
print(a == unicodedata.normalize('NFC', b))   # 正規化すれば、等しくなる
```

```text 実行結果(JavaScript)
が が
false 1 2
true
```

Pythonでも、同じ結果になりました。正規化(NFC)すると、等しくなります。検索や重複チェックで、「見た目は同じなのに一致しない」ことが起きるのは、この違いが原因のことがあります。

```text 実行結果(Python)
が が
False 1 2
True
```

## 直し方:見た目の1文字で扱う

見た目の1文字で数えたり、切ったりするには、書記素に分ける必要があります。JavaScriptは、標準のIntl.Segmenterで分けられます。Pythonは、標準ライブラリにないので、regexライブラリの \\X を使います。Swiftは、標準のcountが、すでに見た目の1文字です。

```js tab:"JavaScript" safe.mjs
// 見た目の1文字(書記素)単位で、先頭から n 文字を取る
const segmenter = new Intl.Segmenter('ja', { granularity: 'grapheme' });
const graphemes = s => [...segmenter.segment(s)].map(x => x.segment);
const truncate = (s, n) => graphemes(s).slice(0, n).join('');

console.log(truncate('a\u{20BB7}b家', 2));                                              // a𠮷
console.log(truncate('\u{1F468}‍\u{1F469}‍\u{1F467}と\u{1F1EF}\u{1F1F5}', 1));  // 家族の絵文字がそのまま
console.log(graphemes('\u{1F1EF}\u{1F1F5}\u{1F1FA}\u{1F1F8}').length);                    // 国旗2つ → 2
```

```python tab:"Python" safe.py
# 見た目の1文字(書記素)単位で、先頭から n 文字を取る
import regex  # pip install regex

def graphemes(s):
    return regex.findall(r'\X', s)

def truncate(s, n):
    return ''.join(graphemes(s)[:n])

print(truncate('a\U00020BB7b家', 2))                                                   # a𠮷
print(truncate('\U0001F468‍\U0001F469‍\U0001F467と\U0001F1EF\U0001F1F5', 1))  # 家族の絵文字がそのまま
print(len(graphemes('\U0001F1EF\U0001F1F5\U0001F1FA\U0001F1F8')))                       # 国旗2つ → 2
```

3つとも、同じ結果になりました(JavaScriptとPythonで一致を確認)。𠮷や、家族の絵文字が、途中で切れません。

```text 実行結果
a𠮷
👨‍👩‍👧
2
```

> Rustは、標準ライブラリに書記素の分割がないので、外部のクレートが必要です。この記事では、Rustの書記素は試していません。書記素の分け方は、Unicodeのバージョンや実装で、結果が変わることがあります。

## チェックリスト

文字列を扱うときに、確認する項目です。

- 「文字数」の制限を決めるとき、数える単位(バイト、UTF-16、コードポイント、見た目の1文字)を決めた
- 切り詰めは、見た目の1文字単位で行っている(lengthやlen()で切っていない)
- 比較や検索の前に、正規化(NFCなど)をそろえている
- 絵文字や国旗は、見た目が1文字でも、内部は複数のコードポイントだと知っている
- データベースの文字数の制限の単位は、使っているデータベースの仕様を確認した(この記事では試していません)

> 試していないこと:ほかの言語(Java、Go、C#など)、データベースの文字数の制限、Webサービスごとの文字数の数え方。これらは、この記事の結果には含まれません。
