---
title: "Colabで試すLLM:無料のGPUで、モデルを動かしてみる"
description: "自分のPCにGPUがなくても、Google Colabの無料のGPUでLLMを動かせる。OllamaとTransformersの2通りの動かし方と、使える範囲、禁止されていること、メモリの見積もりを整理する。"
category: "ai"
tags: ["Colab","ローカルLLM","Ollama"]
minutes: 11
type: "実践ガイド"
level: "Pythonのコードをノートブックで動かせれば十分"
takeaway: "Colabなら、GPUのないPCでも、無料でLLMを試せます。ただし動く場所はGoogleのクラウドで、ローカルではありません。動かす部屋は一時的で、外部への公開はできないので、「試す・学ぶ」ために使います。"
order: 14
sources:
  - { title: "Google Colab — FAQ", url: "https://research.google.com/colaboratory/faq.html" }
  - { title: "Ollama — Documentation", url: "https://docs.ollama.com/" }
  - { title: "Hugging Face — bitsandbytes quantization", url: "https://huggingface.co/docs/transformers/en/quantization/bitsandbytes" }
---

## Colabで何ができるか

Google Colab(コラボ)は、ブラウザで開くノートブックに、Pythonのコードを書いて動かせるサービスです。無料のプランでも、GPUつきの計算機を借りられます。自分のPCにGPUがなくても、LLMを動かして、メモリや量子化の話を、手を動かして確かめられます。

> **これは「ローカル」ではありません。** Colabの計算機は、Googleのクラウドにあります。入力した文章も、取得したモデルも、そこで動きます。機密の文書や、個人情報は入れないでください。データを手元に置きたいなら、[ローカルLLM入門](../local-llm/)のとおり、自分のPCで動かします。

向いている使い方と、向かない使い方は、次のとおりです。

| 向いている | 向かない |
| --- | --- |
| LLMの動きを学ぶ、試す | 常に動かし続けるサービス(自動で消える) |
| 小さなモデルや、量子化の効果を比べる | 外部の人が使えるように公開する(禁止されている) |
| 手元のPCに入りきらないモデルを、試しに動かす | 機密の文書を扱う(Googleのクラウドに送られる) |
| 授業や勉強会で、環境の差をなくす | 大量の処理を、決まった時間に確実に動かす(保証がない) |

## 知っておく制限

制限は、Colabの公式FAQに書かれています。この記事は、2026年10月に確認した内容に基づきます。

- **GPUの種類は、変わる**:無料の範囲で使えるGPUの種類は、時期によって変わる。一般に、T4が割り当てられることが多いと言われますが、保証はありません
- **資源は、保証されない**:無料では、使える量が変動する。混んでいると、GPUが割り当てられないこともある
- **動かせる時間に、上限がある**:無料のノートブックは、最大で12時間まで。しばらく操作しないと、切断される
- **ランタイムは、消える**:仮想マシンは、アイドルが続くと削除され、上限の時間も決まっている。取得したモデルも、消える。ノートブック自体は、Google Driveに保存される

使ってはいけない用途も、定められています(抜粋)。

- Webサービスの提供など、対話的な計算と関係のない用途(**外へ公開する使い方**を含む)
- 外部のプロキシへの接続
- SSHなどでの遠隔操作や、ノートブックを使わず、主にWeb画面で操作する使い方(無料では予告なく停止されることがある)
- 暗号資産の採掘、複数アカウントでの制限の回避

LLMを動かすときに、トンネルのサービスで、ColabのOllamaを外のアプリから使えるようにする方法が紹介されていることがあります。FAQの内容に照らすと、この使い方は制限に当たる可能性が高いので、この記事では扱いません。呼び出しは、**同じノートブックの中**から行います。

## 全体の構成

ノートブックのセルがPythonのコードを実行し、推論エンジン(OllamaまたはTransformers)が、GPUにモデルの重みを載せて答えを作ります。これらはすべて、Googleが用意する一時的な仮想マシンの中で動きます。モデルは配布元から、仮想マシンへ毎回ダウンロードします。ノートブック自体は、Google Driveに保存されます。

<figure class="diagram"><svg viewBox="0 0 400 440" role="img" aria-labelledby="co-t"><title id="co-t">Colabでローカルではなく、Googleのクラウドで動く</title><defs><filter id="co-sh" x="-10%" y="-20%" width="120%" height="150%"><feDropShadow dx="0" dy="2" stdDeviation="2.5" flood-color="#000" flood-opacity=".10"/></filter><linearGradient id="co-g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" style="stop-color:var(--accent);stop-opacity:.09"/><stop offset="1" style="stop-color:var(--accent);stop-opacity:0"/></linearGradient><marker id="co-a" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M1 1.5L9 5L1 8.5z" class="d-arrowhead"/></marker></defs><g class="k-n"><rect x="8" y="8" width="176" height="44" rx="11" class="d-node" filter="url(#co-sh)"/><circle cx="32" cy="30" r="14" class="d-badge"/></g><g class="k-n"><g transform="translate(23,21) scale(.75)" class="d-ico"><path d="M5 6h14v9H5zM3 19h18"/></g></g><text x="54" y="34.5" class="d-ntitle">あなたのブラウザ</text><g class="k-w"><rect x="216" y="8" width="176" height="44" rx="11" class="d-node" filter="url(#co-sh)"/><circle cx="240" cy="30" r="14" class="d-badge"/></g><g class="k-w"><g transform="translate(231,21) scale(.75)" class="d-ico"><path d="M7 3h7l4 4v14H7zM14 3v4h4M9.5 12h6M9.5 16h6"/></g></g><text x="262" y="28" class="d-ntitle">Google Drive</text><text x="262" y="43" class="d-nsub">ノートブックの保存先</text><path d="M186 30 H214" class="d-path" marker-end="url(#co-a)"/><circle r="3" class="d-dot" opacity="0"><animateMotion dur="2.4s" begin="0s" repeatCount="indefinite" path="M186 30 H214"/><animate attributeName="opacity" values="0;1;1;0" keyTimes="0;.15;.85;1" dur="2.4s" begin="0s" repeatCount="indefinite"/></circle><text x="200" y="24" class="d-nsub" text-anchor="middle">保存</text><path d="M96 54 V112" class="d-path" marker-end="url(#co-a)"/><circle r="3" class="d-dot" opacity="0"><animateMotion dur="2.4s" begin="0.5s" repeatCount="indefinite" path="M96 54 V112"/><animate attributeName="opacity" values="0;1;1;0" keyTimes="0;.15;.85;1" dur="2.4s" begin="0.5s" repeatCount="indefinite"/></circle><text x="106" y="69" class="d-nsub">操作</text><rect x="8" y="76" width="384" height="272" rx="14" fill="url(#co-g)" class="d-group"/><text x="24" y="96" class="d-gtitle">Colabのランタイム(一時的な仮想マシン)</text><g class="k-n"><rect x="24" y="112" width="352" height="50" rx="11" class="d-node" filter="url(#co-sh)"/><circle cx="48" cy="137" r="14" class="d-badge"/></g><g class="k-n"><g transform="translate(39,128) scale(.75)" class="d-ico"><path d="M4 5h16v11H9l-5 4z"/></g></g><text x="70" y="135" class="d-ntitle">ノートブックのセル</text><text x="70" y="150" class="d-nsub">Pythonのコードを実行</text><path d="M200 164 V182" class="d-path" marker-end="url(#co-a)"/><circle r="3" class="d-dot" opacity="0"><animateMotion dur="2.4s" begin="1s" repeatCount="indefinite" path="M200 164 V182"/><animate attributeName="opacity" values="0;1;1;0" keyTimes="0;.15;.85;1" dur="2.4s" begin="1s" repeatCount="indefinite"/></circle><g class="k-a"><rect x="24" y="184" width="352" height="50" rx="11" class="d-node" filter="url(#co-sh)"/><circle cx="48" cy="209" r="14" class="d-badge"/></g><g class="k-a"><g transform="translate(39,200) scale(.75)" class="d-ico"><path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8zM18.5 15l.7 1.8 1.8.7-1.8.7-.7 1.8-.7-1.8-1.8-.7 1.8-.7z"/></g></g><text x="70" y="207" class="d-ntitle">推論エンジン</text><text x="70" y="222" class="d-nsub">OllamaまたはTransformers</text><path d="M200 236 V254" class="d-path" marker-end="url(#co-a)"/><circle r="3" class="d-dot" opacity="0"><animateMotion dur="2.4s" begin="1.5s" repeatCount="indefinite" path="M200 236 V254"/><animate attributeName="opacity" values="0;1;1;0" keyTimes="0;.15;.85;1" dur="2.4s" begin="1.5s" repeatCount="indefinite"/></circle><g class="k-a"><rect x="24" y="256" width="352" height="56" rx="11" class="d-node" filter="url(#co-sh)"/><circle cx="48" cy="284" r="14" class="d-badge"/></g><g class="k-a"><g transform="translate(39,275) scale(.75)" class="d-ico"><path d="M7 7h10v10H7zM10 3v4M14 3v4M10 17v4M14 17v4M3 10h4M3 14h4M17 10h4M17 14h4"/></g></g><text x="70" y="282" class="d-ntitle">GPU(T4など)</text><text x="70" y="297" class="d-nsub">モデルの重みを載せる</text><text x="200" y="334" class="d-nsub" text-anchor="middle">消える:アイドルや最大12時間</text><path d="M200 376 V350" class="d-path" marker-end="url(#co-a)"/><circle r="3" class="d-dot" opacity="0"><animateMotion dur="2s" begin="0s" repeatCount="indefinite" path="M200 376 V350"/><animate attributeName="opacity" values="0;1;1;0" keyTimes="0;.15;.85;1" dur="2s" begin="0s" repeatCount="indefinite"/></circle><g class="k-n"><rect x="24" y="378" width="352" height="50" rx="11" class="d-node" filter="url(#co-sh)"/><circle cx="48" cy="403" r="14" class="d-badge"/></g><g class="k-n"><g transform="translate(39,394) scale(.75)" class="d-ico"><path d="M7 18a4 4 0 0 1-.5-8 5.5 5.5 0 0 1 10.7 1.2A3.4 3.4 0 0 1 17 18z"/></g></g><text x="70" y="401" class="d-ntitle">モデルの配布元</text><text x="70" y="416" class="d-nsub">Ollama・Hugging Face。毎回ダウンロード</text><text x="208" y="368" class="d-nsub">ダウンロード</text></svg><figcaption>図1 動く場所はGoogleのクラウド上の一時的な仮想マシン。モデルは毎回ダウンロードし、仮想マシンが消えると一緒に消える。外部には公開しない。</figcaption></figure>

## 準備:GPUをつなぐ

1. ノートブックを新しく作る
2. 「ランタイム」メニューの「ランタイムのタイプを変更」で、ハードウェアアクセラレータに**GPU**を選ぶ
3. 最初のセルで、GPUが割り当てられたかを確かめる

```bash セル1(GPUの確認)
%%bash
nvidia-smi
```

GPUの名前とメモリの量が表示されれば、割り当てられています。表示されなければ、ランタイムのタイプを見直すか、時間をおいて、もう一度試します。

## 方法A:Ollamaを、ノートブックの中で動かす

[ローカルLLM入門](../local-llm/)で使ったOllamaを、ノートブックの中にインストールして、動かします。

```bash セル2(Ollamaのインストール)
%%bash
curl -fsSL https://ollama.com/install.sh | sh
```

```python セル3(サーバーを、背景で起動する)
import subprocess
import time
import urllib.request

# ノートブックの実行を止めないように、サーバーは背景のプロセスとして起動する
server = subprocess.Popen(["ollama", "serve"], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

for _ in range(30):  # 起動するまで、最大30秒待つ
    try:
        urllib.request.urlopen("http://localhost:11434")
        break
    except Exception:
        time.sleep(1)
```

```bash セル4(モデルを取得する)
%%bash
# <モデル名>は、Ollamaのモデル一覧から選ぶ。ノートブックを開き直すたびに、取得し直す
ollama pull <モデル名>
```

```python セル5(質問する)
import json
import urllib.request


def chat(question, model="<モデル名>"):
    body = {"model": model, "messages": [{"role": "user", "content": question}], "stream": False}
    request = urllib.request.Request(
        "http://localhost:11434/api/chat",
        data=json.dumps(body).encode(),
        headers={"Content-Type": "application/json"},
    )
    with urllib.request.urlopen(request, timeout=300) as response:
        return json.load(response)["message"]["content"]


print(chat("日本の首都はどこですか。一文で答えてください。"))
```

インストールで、足りないパッケージのエラーが出ることがあります。メッセージに従って、必要なパッケージを入れてから、やり直してください。インストールの手順は変わることがあるので、公式ドキュメントも見てください。`localhost`は、このノートブックの計算機の中だけを指します。外の人からは、つながりません。

## 方法B:Transformersで、直接動かす

もう1つの方法は、Hugging FaceのTransformersライブラリで、モデルを直接読み込むことです。サーバーを立てず、Pythonだけで完結します。メモリが小さいGPUでも載るように、4ビットの量子化(bitsandbytes)で読み込みます。

```bash セル(ライブラリのインストール)
%%bash
pip install -q transformers accelerate bitsandbytes
```

```python セル(モデルを読み込んで、質問する)
import torch
from transformers import AutoModelForCausalLM, AutoTokenizer, BitsAndBytesConfig

name = "<モデル名>"  # Hugging Faceのモデル名

# 4ビットで読み込む。T4など古い世代のGPUはbfloat16を使えないことがあるので、float16にする
quant = BitsAndBytesConfig(load_in_4bit=True, bnb_4bit_compute_dtype=torch.float16)
tokenizer = AutoTokenizer.from_pretrained(name)
model = AutoModelForCausalLM.from_pretrained(name, quantization_config=quant, device_map="auto")

messages = [{"role": "user", "content": "日本の首都はどこですか。一文で答えてください。"}]
inputs = tokenizer.apply_chat_template(messages, add_generation_prompt=True, return_tensors="pt", return_dict=True).to(model.device)
output = model.generate(**inputs, max_new_tokens=100)
print(tokenizer.decode(output[0][inputs["input_ids"].shape[1]:], skip_special_tokens=True))
```

モデルによっては、Hugging Faceで利用条件に同意して、アクセストークンを使う必要があります。トークンは、ノートブックのコードに直接書かず、Colabの「シークレット」機能に保存してください。ノートブックを共有したときに、トークンが漏れるのを防げます。

| 観点 | Ollama(方法A) | Transformers(方法B) |
| --- | --- | --- |
| 手軽さ | コマンド数行で動く | Pythonのコードが必要 |
| 形式 | 配布されている量子化済みの形式 | Hugging Faceのモデルを、読み込み時に量子化する |
| 向いている使い方 | 質問を投げて、答えを見る | モデルの中身や、生成の設定を細かく触る |
| ローカルでの再利用 | 自分のPCのOllamaと同じ使い方 | 研究や、ファインチューニングへつなげやすい |

## 載るモデルの大きさを見積もる

無料で使えるGPUのメモリは、一般に16GB前後のものが多いと言われます(GPUの種類は変わります)。ここに、重みとKVキャッシュが載る必要があります。[メモリ見積もりツール](https://paibot.app/ja/llm-memory)や、入門記事の式で、載るかどうかを先に確かめます。

- 70億パラメータ(7B)を4ビットで読み込むと、重みは約3.5GBで、余裕がある
- 140億(14B)の4ビットは約7GBで、載る見込みがある
- 320億(32B)の4ビットは約16GBで、メモリいっぱいになり、載らない可能性が高い
- 長い文脈や、複数の質問を同時に処理すると、KVキャッシュが増える([続編の記事](../local-llm-serving/)を参照)

GPUに載らないモデルを読み込もうとすると、メモリ不足のエラーで止まります。そのときは、小さなモデルにするか、ビット数を減らします。

## ノートブックを整える

ランタイムが消えると、取得したモデルも消えます。次のことを決めておくと、困りません。

- ノートブックの先頭に、**環境を作るセルをまとめる**(GPUの確認、インストール、サーバーの起動)。開き直したら、上から順に実行すれば、もとに戻る
- モデルは、**毎回取得し直す**のが基本。時間がかかるので、小さなモデルから試す
- 結果を残したいときは、Google Driveなどに、**ランタイムの外へ保存する**
- 長い処理を始める前に、**GPUが割り当てられていること**を確かめる

## うまくいかないとき

| 症状 | 考えられる原因 | 試すこと |
| --- | --- | --- |
| GPUが表示されない | ランタイムのタイプがGPUではない、または空きがない | ランタイムのタイプを確認する。時間をおいて、やり直す |
| メモリ不足で止まる | モデルが大きい、文脈が長い | 小さなモデルにする。ビット数を減らす。生成する長さを短くする |
| 途中で切断される | アイドルが続いた、時間の上限に達した | 環境を作るセルを、上から実行し直す |
| モデルの取得が遅い | モデルが大きい | 小さなモデルから試す |
| サーバーにつながらない | 起動が間に合っていない、または落ちている | セル3を、もう一度実行して、起動を待つ |

## 確認リスト

- [ ] 機密や個人情報を、ノートブックに入れていないか(動く場所はGoogleのクラウド)
- [ ] ランタイムのタイプを、GPUにしたか。`nvidia-smi`で確認したか
- [ ] 選んだモデルが、GPUのメモリに載ることを見積もったか
- [ ] アクセストークンを、コードに直接書かず、シークレットに保存したか
- [ ] 外部に公開する使い方を、していないか(Colabでは禁止されている)
- [ ] 環境を作るセルを、まとめたか。結果の保存先を決めたか
