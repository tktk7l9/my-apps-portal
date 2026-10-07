---
title: AI リテラシー教材を古くしないために
date: 2026-10-07
summary: AI Primer は各レッスンに最終確認日を持たせ、90 日を過ぎた項目は月次のワークフローが知らせる。2026 年 10 月の見直しで変わっていた事実、一次情報で確かめられない出典の扱い、内部リンクと日付のテストで見つけた穴。
tags: [ai-primer, learning-apps, fact-checking, testing]
apps: [ai-primer]
sources:
  - https://github.com/tktk7l9/ai-primer/pull/52
  - https://github.com/tktk7l9/ai-primer/pull/61
  - https://github.com/tktk7l9/ai-primer/pull/62
  - https://github.com/tktk7l9/ai-primer/blob/main/docs/refresh-runbook.md
  - https://github.com/tktk7l9/ai-primer
---

[AI Primer](https://ai-primer.saitotakuya0719.workers.dev) は、AI の用語・仕組み・使い方を日本語と英語で学ぶ教材です。AI の製品や制度は数か月で変わるので、書いた時点では正しくても、放っておくと誤った教材になります。2026-10-06〜07 の 3 本の PR（#52・#61・#62）で全項目を見直し、レッスンを 6 本ずつ 3 回足して、10 トラック 58 レッスンになりました。

## 最終確認日と 90 日のしきい値

レッスン・モデルカタログ・年表・用語集の各項目は、出典の URL と `lastVerified`（最終確認日）を持っています。レッスンの画面には「最終確認: 2026年10月」のバッジを出し、確認から 90 日を過ぎた項目には「この内容は90日以上前に確認されたものです」と文字で添えます。

毎月 2 日の朝（JST）には、GitHub Actions が `check-freshness.ts` を実行し、全出典の URL の死活と、90 日を過ぎた項目を調べます。どちらかがあれば Issue を作るだけで、本文は自動では書き換えません。事実の確認には一次情報を読む判断が要りますし、`fetch()` だけだと openai.com や Britannica などがボット判定で 403 を返す（ブラウザでは開ける）からです。

## 一次情報で確かめたものだけ日付を進める

#52 は、全項目が 2026-10-14 に 90 日を超える直前の見直しでした。各社のドキュメント・公式ブログ・官公庁のページに当たって確かめられたものだけ `lastVerified` を進め、公式ページがボット判定で開けなかった Perplexity と Midjourney は日付を据え置いています。xAI のさらなる改称の報道も、一次情報と Wikipedia で確かめられなかったので反映していません。

見直しで変わっていた事実は、たとえば次のとおりです。

- Sora: 2026-03-24 に終了が発表され、アプリは 4 月 26 日、API は 9 月 24 日に停止。モデルカタログから外し、Runway を足した
- DALL·E: DALL·E 2/3 の API は 2026-05-12 に停止。カタログの項目を ChatGPT Images（GPT Image）にした
- Grok の開発元: xAI は 2026-02-02 に SpaceX の傘下になり、7 月に SpaceXAI へ改称
- Excel の COPILOT 関数: 2026-09-14 に提供を終えていたので、表計算のレッスンでは扱わず、Copilot in Excel の FAQ だけを使った
- AI事業者ガイドライン: 2024 年 4 月の第 1.0 版から改訂が続き、2026-03-31 に第 1.2 版が出ていた

既存のレッスンにも誤りが見つかりました。ダートマス会議のレッスンでは、シャノンの所属を IBM からベル研究所に、「ネイサン」・ロチェスターを「ナサニエル」に直しています。

製品の既定の扱いも、公式の記述どおりに書きます。音声 AI のレッスンでは、OpenAI の説明に沿って、ChatGPT の音声会話の録音クリップは書き起こしと一緒に 30 日間保持され、録音は利用者が共有を選ばない限り学習に使われない、と書きました。「仕事でAIを使う」トラックでは、製品の機能に触れる箇所に「2026年10月時点の公式ヘルプ」と日付を書き、そのページを出典に入れています。

## 確かめられない出典は使わない

一次情報に当たれないものは、本文に書かないか、別の出典に替えました（#61・#62）。

- 出版倫理の COPE の声明は 403 だったので、ICMJE の指針を使った
- Zoom AI Companion のプライバシーのページは 404 だったので、Zoom には触れていない
- Claude の音声モードで音声そのものが保存されるかは、公式の記述が見つからなかったので書いていない

法令を扱うレッスン（日本の著作権法・AI のルール・資料づくり）には、「一般的な情報で、法的助言ではない」旨を本文に書いています。

## テストで見つけた 2 つの穴

1 つ目は内部リンクです。ChatGPT・Claude・Gemini・選び方のレッスン本文にある「モデルカタログ」へのリンクが `/models` になっていて、404 でした。全ページが `/ja` か `/en` の下にあるためです。本文を `/ja/models` と `/en/models` に直し、「本文の内部リンクは同じ言語の実在するページを指す」というテストを足しました。修正前の本文でこのテストが落ちることも確かめています。#62 で足した内部リンク 32 本も、このテストを通っています。

2 つ目は日付のテストです。「`lastVerified` が未来の日付でない」という判定が、その日の UTC の 0 時と比べていました。日本の日付は UTC の 0 時より 9 時間早く始まるので、当日の日付が毎朝 9 時（JST）までは「未来」として落ちていました（07:49 JST に再現）。日付の始まりを JST で数えて比べるように直し、翌日以降の日付は従来どおり落ちます。このポートフォリオの記事のテストも、今日の日付を `Asia/Tokyo` で求めてから比べています。

## 参考

- [ai-primer PR #52](https://github.com/tktk7l9/ai-primer/pull/52)（2026-10 の鮮度確認と 6 レッスン）
- [ai-primer PR #61](https://github.com/tktk7l9/ai-primer/pull/61)（6 レッスン・内部リンクのテスト・日付のテストの修正）
- [ai-primer PR #62](https://github.com/tktk7l9/ai-primer/pull/62)（「仕事でAIを使う」トラック・使わなかった出典）
- [docs/refresh-runbook.md](https://github.com/tktk7l9/ai-primer/blob/main/docs/refresh-runbook.md)・[freshness-report.yml](https://github.com/tktk7l9/ai-primer/blob/main/.github/workflows/freshness-report.yml)・[staleness.ts](https://github.com/tktk7l9/ai-primer/blob/main/src/engine/freshness/staleness.ts)
- [AI Primer の README](https://github.com/tktk7l9/ai-primer#readme)（10 トラック・58 レッスン）
- [my-apps-portal の content.test.ts](https://github.com/tktk7l9/my-apps-portal/blob/main/src/lib/blog/content.test.ts)（記事の日付の判定）
