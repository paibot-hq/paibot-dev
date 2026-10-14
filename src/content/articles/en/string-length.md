---
title: "The length of \"👨‍👩‍👧\" is 8 in JavaScript, 5 in Python, 18 in Rust and 1 in Swift"
description: "The same string has a different “length” in each language. I counted 𠮷野家, a flag and a family emoji in four languages, to see why, and how to handle them without breaking anything."
category: "cs"
tags: ["Unicode","Strings","JavaScript","Python"]
minutes: 9
type: "Beginner guide"
level: "If you can read any one of the languages, that’s enough"
takeaway: "“Number of characters” can be counted four ways: bytes, UTF-16 units, code points, and what a person sees as one character. Each language’s default “length” counts a different one. I checked it in four languages."
order: 7
sources:
  - { title: "MDN — String: length", url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/length" }
  - { title: "Unicode® Standard Annex #29: Unicode Text Segmentation", url: "https://www.unicode.org/reports/tr29/" }
  - { title: "Python — Built-in Types: str", url: "https://docs.python.org/3/library/stdtypes.html#str" }
  - { title: "The Swift Programming Language — Strings and Characters", url: "https://docs.swift.org/swift-book/documentation/the-swift-programming-language/stringsandcharacters/" }
---

## The results first

The emoji 👨‍👩‍👧 looks like one character. Count its length with each language’s default method and the answers all differ.

<figure class="diagram"><svg viewBox="0 0 400 410" role="img" aria-labelledby="ul-t"><title id="ul-t">The length of a family emoji depends on what you count</title><defs><marker id="ul-a" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0L10 5L0 10z" class="d-arrowhead"/></marker></defs><text x="200" y="52" text-anchor="middle" style="font-size:38px">👨‍👩‍👧</text><text x="200" y="74" class="d-small" text-anchor="middle">Looks like 1 character</text><text x="12" y="92" class="d-small d-strong">Code points (5)</text><rect x="12" y="98" width="68" height="34" rx="6" class="d-accent-soft"/><text x="46" y="123" text-anchor="middle" style="font-size:20px">👨</text><rect x="89" y="98" width="68" height="34" rx="6" class="d-box"/><text x="123" y="120" class="d-small d-mono" text-anchor="middle">ZWJ</text><rect x="166" y="98" width="68" height="34" rx="6" class="d-accent-soft"/><text x="200" y="123" text-anchor="middle" style="font-size:20px">👩</text><rect x="243" y="98" width="68" height="34" rx="6" class="d-box"/><text x="277" y="120" class="d-small d-mono" text-anchor="middle">ZWJ</text><rect x="320" y="98" width="68" height="34" rx="6" class="d-accent-soft"/><text x="354" y="123" text-anchor="middle" style="font-size:20px">👧</text><text x="12" y="158" class="d-small d-strong">UTF-16 (8 units)</text><rect x="12.0" y="164" width="92.0" height="30" rx="4" class="d-seg-tool" fill-opacity="1"/><text x="58" y="184" class="d-white" text-anchor="middle">2</text><rect x="106.0" y="164" width="45.0" height="30" rx="4" class="d-seg-tool" fill-opacity="0.55"/><text x="128.5" y="184" class="d-white" text-anchor="middle">1</text><rect x="153.0" y="164" width="92.0" height="30" rx="4" class="d-seg-tool" fill-opacity="1"/><text x="199" y="184" class="d-white" text-anchor="middle">2</text><rect x="247.0" y="164" width="45.0" height="30" rx="4" class="d-seg-tool" fill-opacity="0.55"/><text x="269.5" y="184" class="d-white" text-anchor="middle">1</text><rect x="294.0" y="164" width="92.0" height="30" rx="4" class="d-seg-tool" fill-opacity="1"/><text x="340" y="184" class="d-white" text-anchor="middle">2</text><text x="12" y="220" class="d-small d-strong">UTF-8 (18 bytes)</text><rect x="12.0" y="226" width="81.6" height="30" rx="4" class="d-seg-out" fill-opacity="1"/><text x="52.77777777777778" y="246" class="d-white" text-anchor="middle">4</text><rect x="95.6" y="226" width="60.7" height="30" rx="4" class="d-seg-out" fill-opacity="0.55"/><text x="125.88888888888889" y="246" class="d-white" text-anchor="middle">3</text><rect x="158.2" y="226" width="81.6" height="30" rx="4" class="d-seg-out" fill-opacity="1"/><text x="199" y="246" class="d-white" text-anchor="middle">4</text><rect x="241.8" y="226" width="60.7" height="30" rx="4" class="d-seg-out" fill-opacity="0.55"/><text x="272.1111111111111" y="246" class="d-white" text-anchor="middle">3</text><rect x="304.4" y="226" width="81.6" height="30" rx="4" class="d-seg-out" fill-opacity="1"/><text x="345.22222222222223" y="246" class="d-white" text-anchor="middle">4</text><text x="12" y="292" class="d-small d-strong">Each language’s default “length”</text><rect x="12" y="300" width="184" height="44" rx="8" class="d-ok"/><text x="22" y="319" class="d-small d-mono">JavaScript  .length</text><text x="22" y="336" class="d-small">UTF-16 units</text><text style="font-size:22px" x="186" y="332" class="d-strong" text-anchor="end">8</text><rect x="204" y="300" width="184" height="44" rx="8" class="d-accent-soft"/><text x="214" y="319" class="d-small d-mono">Python  len()</text><text x="214" y="336" class="d-small">code points</text><text style="font-size:22px" x="378" y="332" class="d-strong" text-anchor="end">5</text><rect x="12" y="352" width="184" height="44" rx="8" class="d-warn"/><text x="22" y="371" class="d-small d-mono">Rust  .len()</text><text x="22" y="388" class="d-small">UTF-8 bytes</text><text style="font-size:22px" x="186" y="384" class="d-strong" text-anchor="end">18</text><rect x="204" y="352" width="184" height="44" rx="8" class="d-box"/><text x="214" y="371" class="d-small d-mono">Swift  .count</text><text x="214" y="388" class="d-small">user-perceived chars</text><text style="font-size:22px" x="378" y="384" class="d-strong" text-anchor="end">1</text></svg><figcaption>Figure 1. A family emoji looks like one character to a person. Inside, it is 5 code points (including zero-width joiners), 8 UTF-16 units and 18 UTF-8 bytes. Each language’s default “length” counts a different one of these.</figcaption></figure>

|  | JavaScript .length | Python len() | Swift .count | Rust .len() |
| --- | --- | --- | --- | --- |
| 👨‍👩‍👧 | 8 | 5 | 1 | 18 |
| 🇯🇵 | 4 | 2 | 1 | 8 |
| 𠮷野家 | 4 | 3 | 3 | 10 |

None of them is wrong. They just count different things. Under the same name, “length,” each language returns something else. This article is the result of actually running the code in four languages.

## Try your own text

Type anything: a name, an emoji, a flag. The four counts change, and you can watch the text split into characters. With the slider you can also compare what breaks and what doesn’t when you take the first few characters. Everything is computed in your own browser.

<div class="widget" data-widget="string-lab"><p class="lab-small">JavaScript is required for this interactive lab.</p></div>

## Four ways to count

“Number of characters” changes depending on which of these four you count.

- UTF-8 bytes: the size when written to a file or sent over a network. In my runs, Rust’s .len() returned this
- UTF-16 units: what JavaScript’s length counts. MDN describes it as the length “in UTF-16 code units,” and notes that one Unicode character can be one or two units, so it may not match the actual number of characters
- Code points: the number assigned to each Unicode character. A Python str is an “immutable sequence of Unicode code points,” and len() is its count (official documentation)
- User-perceived characters (grapheme clusters): what a person feels is one character. Unicode’s UAX #29 gives the example of “G” plus a grave accent: users think of it as a single character, yet it is represented by two code points. In my runs, Swift’s count returned this

## Checking it in code

I counted the same nine strings four ways in four languages (I ran them on Node.js 26.1.0, Python 3.11.5, Swift 6.1 and Rust 1.86.0). For the counts they share, the four languages agreed exactly. Rust has three, because its standard library can’t count graphemes. Counting graphemes in Python uses the regex library, so run pip install regex first.

```js tab:"JavaScript" count.mjs
// Count the same strings in four ways (JavaScript)
const samples = [
  ['A', 'A'],
  ['あ', 'あ'],
  ['が (one code point)', 'が'],
  ['が (か + dakuten)', 'が'],
  ['𠮷', '\u{20BB7}'],
  ['𠮷野家', '\u{20BB7}野家'],
  ['😀', '\u{1F600}'],
  ['🇯🇵', '\u{1F1EF}\u{1F1F5}'],
  ['👨‍👩‍👧', '\u{1F468}‍\u{1F469}‍\u{1F467}'],
];
const segmenter = new Intl.Segmenter('ja', { granularity: 'grapheme' });
for (const [name, s] of samples) {
  const utf8 = Buffer.byteLength(s, 'utf8');
  const utf16 = s.length;                       // JavaScript's length is the number of UTF-16 code units
  const codePoints = [...s].length;             // spreading gives code points
  const graphemes = [...segmenter.segment(s)].length;
  console.log(`${name}\tutf8=${utf8}\tutf16=${utf16}\tcodepoints=${codePoints}\tgraphemes=${graphemes}`);
}
```

```python tab:"Python" count.py
# Count the same strings in four ways (Python). Counting graphemes is not in the standard library, so we use regex
import regex  # pip install regex

samples = [
    ('A', 'A'),
    ('あ', 'あ'),
    ('が (one code point)', 'が'),
    ('が (か + dakuten)', 'が'),
    ('𠮷', '\U00020BB7'),
    ('𠮷野家', '\U00020BB7野家'),
    ('😀', '\U0001F600'),
    ('🇯🇵', '\U0001F1EF\U0001F1F5'),
    ('👨‍👩‍👧', '\U0001F468‍\U0001F469‍\U0001F467'),
]
for name, s in samples:
    utf8 = len(s.encode('utf-8'))
    utf16 = len(s.encode('utf-16-le')) // 2       # number of UTF-16 code units
    codepoints = len(s)                           # Python's len is the number of code points
    graphemes = len(regex.findall(r'\X', s))      # \X matches one user-perceived character
    print(f'{name}\tutf8={utf8}\tutf16={utf16}\tcodepoints={codepoints}\tgraphemes={graphemes}')
```

```swift tab:"Swift" count.swift
// Count the same strings in four ways (Swift)
let samples: [(String, String)] = [
    ("A", "A"),
    ("あ", "あ"),
    ("が (one code point)", "\u{304C}"),
    ("が (か + dakuten)", "\u{304B}\u{3099}"),
    ("𠮷", "\u{20BB7}"),
    ("𠮷野家", "\u{20BB7}野家"),
    ("😀", "\u{1F600}"),
    ("🇯🇵", "\u{1F1EF}\u{1F1F5}"),
    ("👨‍👩‍👧", "\u{1F468}\u{200D}\u{1F469}\u{200D}\u{1F467}"),
]
for (name, s) in samples {
    // Swift's count is the number of user-perceived characters (grapheme clusters)
    print("\(name)\tutf8=\(s.utf8.count)\tutf16=\(s.utf16.count)\tcodepoints=\(s.unicodeScalars.count)\tgraphemes=\(s.count)")
}
```

```rust tab:"Rust" count.rs
// Count the same strings in three ways (Rust). Graphemes aren't in the standard library, so we don't count them here
fn main() {
    let samples = [
        ("A", "A".to_string()),
        ("あ", "あ".to_string()),
        ("が (one code point)", "\u{304C}".to_string()),
        ("が (か + dakuten)", "\u{304B}\u{3099}".to_string()),
        ("𠮷", "\u{20BB7}".to_string()),
        ("𠮷野家", "\u{20BB7}野家".to_string()),
        ("😀", "\u{1F600}".to_string()),
        ("🇯🇵", "\u{1F1EF}\u{1F1F5}".to_string()),
        ("👨‍👩‍👧", "\u{1F468}\u{200D}\u{1F469}\u{200D}\u{1F467}".to_string()),
    ];
    for (name, s) in samples.iter() {
        // len() is the number of UTF-8 bytes, chars().count() is the number of code points
        println!("{}\tutf8={}\tutf16={}\tcodepoints={}", name, s.len(), s.encode_utf16().count(), s.chars().count());
    }
}
```

The results are below (the JavaScript version; all four languages gave the same values).

| String | UTF-8 bytes | UTF-16 units | Code points | User-perceived characters |
| --- | --- | --- | --- | --- |
| A | 1 | 1 | 1 | 1 |
| あ | 3 | 1 | 1 | 1 |
| が (one code point) | 3 | 1 | 1 | 1 |
| が (か + dakuten) | 6 | 2 | 2 | 1 |
| 𠮷 | 4 | 2 | 1 | 1 |
| 𠮷野家 | 10 | 4 | 3 | 3 |
| 😀 | 4 | 2 | 1 | 1 |
| 🇯🇵 | 8 | 4 | 2 | 1 |
| 👨‍👩‍👧 | 18 | 8 | 5 | 1 |

## Truncating breaks things

“Show only the first N characters” breaks characters if you count the wrong thing. The code below truncates by “length.”

```js tab:"JavaScript" truncate.mjs
const s = 'a\u{20BB7}b';                       // a𠮷b
const cut = s.slice(0, 2);                      // take the first 2 code units
console.log(JSON.stringify(cut));               // cut in the middle of 𠮷: a broken character
console.log(cut.isWellFormed());                // false

const family = '\u{1F468}‍\u{1F469}‍\u{1F467}';
console.log([...family].slice(0, 3).join(''));  // not a family any more: two people
```

```python tab:"Python" truncate.py
family = '\U0001F468‍\U0001F469‍\U0001F467'
print(family[:3])   # not a family any more: two people
print(family[:1])   # just one person
```

Here is the JavaScript output. Taking the first 2 units of a𠮷b cuts 𠮷 in the middle and leaves a broken value (a lone surrogate), and isWellFormed() returned false. Taking three code points of the family emoji gives an emoji of two people, not a family.

```text Output (JavaScript)
"a\ud842"
false
👨‍👩
```

Python cuts by code point, so it never breaks 𠮷 in the middle. But the family emoji still turns into two people or one.

```text Output (Python)
👨‍👩
👨
```

## The same “が” can be written two ways

“が” can be written as one code point, or as two: “か” plus a dakuten (voiced mark). They look the same but differ inside, and comparing them says they are not equal.

```js tab:"JavaScript" normalize.mjs
const a = 'が';          // が (one code point)
const b = 'が';    // か + dakuten (two code points)
console.log(a, b);           // they look the same
console.log(a === b, a.length, b.length);
console.log(a === b.normalize('NFC'));   // equal once normalized
```

```python tab:"Python" normalize.py
import unicodedata

a = 'が'          # が (one code point)
b = 'が'    # か + dakuten (two code points)
print(a, b)           # they look the same
print(a == b, len(a), len(b))
print(a == unicodedata.normalize('NFC', b))   # equal once normalized
```

```text Output (JavaScript)
が が
false 1 2
true
```

Python gave the same result. Once normalized (NFC), they become equal. This difference can be the cause when search or duplicate checks say “they look the same but don’t match.”

```text Output (Python)
が が
False 1 2
True
```

## The fix: work in user-perceived characters

To count or cut by user-perceived character, you need to split into graphemes. JavaScript can do it with the built-in Intl.Segmenter. Python’s standard library can’t, so use \\X from the regex library. In Swift, the built-in count is already user-perceived characters.

```js tab:"JavaScript" safe.mjs
// Take the first n user-perceived characters (graphemes)
const segmenter = new Intl.Segmenter('ja', { granularity: 'grapheme' });
const graphemes = s => [...segmenter.segment(s)].map(x => x.segment);
const truncate = (s, n) => graphemes(s).slice(0, n).join('');

console.log(truncate('a\u{20BB7}b家', 2));                                              // a𠮷
console.log(truncate('\u{1F468}‍\u{1F469}‍\u{1F467}と\u{1F1EF}\u{1F1F5}', 1));  // the family emoji stays whole
console.log(graphemes('\u{1F1EF}\u{1F1F5}\u{1F1FA}\u{1F1F8}').length);                    // two flags -> 2
```

```python tab:"Python" safe.py
# Take the first n user-perceived characters (graphemes)
import regex  # pip install regex

def graphemes(s):
    return regex.findall(r'\X', s)

def truncate(s, n):
    return ''.join(graphemes(s)[:n])

print(truncate('a\U00020BB7b家', 2))                                                   # a𠮷
print(truncate('\U0001F468‍\U0001F469‍\U0001F467と\U0001F1EF\U0001F1F5', 1))  # the family emoji stays whole
print(len(graphemes('\U0001F1EF\U0001F1F5\U0001F1FA\U0001F1F8')))                       # two flags -> 2
```

Both gave the same result (I confirmed that JavaScript and Python agree). 𠮷 and the family emoji are not cut in the middle.

```text Output
a𠮷
👨‍👩‍👧
2
```

> Rust’s standard library has no grapheme splitting, so you need an external crate. I did not try graphemes in Rust for this article. How graphemes are split can change with the Unicode version and the implementation.

## Checklist

Things to check when handling strings.

- When you set a “character” limit, you decided the unit (bytes, UTF-16, code points, user-perceived characters)
- You truncate by user-perceived character (not by length or len())
- You normalize (NFC and so on) before comparing or searching
- You know that an emoji or a flag that looks like one character is several code points inside
- You checked the database’s own unit for its character limits (I did not test this)

> Not tested: other languages (Java, Go, C# and so on), database character limits, and how each web service counts characters. None of these are covered by the results here.
