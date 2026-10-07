---
title: 300 を超えるコード片を公式の処理系で動かした話
date: 2026-10-07
summary: タイピングゲーム Snippet Sprint の問題を 118 問から 375 問に増やした。問題の文字列をそのまま処理系に通し、配布物はチェックサムで照合し、画面に収まるかも測った。確かめられなかったものも書き残す。
tags: [snippet-sprint, testing, learning-apps]
apps: [snippet-sprint]
sources:
  - https://github.com/tktk7l9/snippet-sprint/pull/26
  - https://github.com/tktk7l9/snippet-sprint/pull/32
  - https://github.com/tktk7l9/snippet-sprint/pull/34
  - https://github.com/tktk7l9/snippet-sprint
---

[Snippet Sprint](https://snippet-sprint.saitotakuya0719.workers.dev) は、実際のコード片を 1 問ずつ打って練習するタイピングゲームです。2026-10-06 の 3 本の PR で、問題を 118 問から 375 問に、言語を記号ドリルも含めて 23 に増やしました（#26・#32・#34）。打つ人は画面のとおりに指で覚えるので、コンパイルできないコードを混ぜるわけにはいきません。そこで足した問題だけでなく既存の問題も、各言語の処理系に通しました。

## 画面の文字列をそのまま動かす

検証のスクリプトはリポジトリの外に置き、リポジトリの `content` をバンドルして問題の文字列をそのまま取り出します。そこに前後の文脈とアサーションを足して実行します。画面に出るコードそのものを確かめるためです。

#26 では、記号ドリルを除く 273 問を 490 のチェックにかけ、失敗は 0 でした。TypeScript は `tsc --strict` で型を調べてから Node 24 で実行し、Python は `-W error` で警告も失敗にしました。C と C++ は clang 21 でコンパイルし（C++ は `-Wall -Wextra -Werror`）、SQL は sqlite3 にスキーマを入れてから実行しています。

#32・#34 では整形とリンターも通しました。Zig は `zig fmt --check`、Dart は `dart format` と analyzer、Lua は StyLua と luacheck、R は lintr で、差分も警告も 0 です。

アサーションは出力の一致だけではありません。Lua のシャッフルは 3 要素を 60,000 回並べ替えて 6 通りが均等に出るか（10,000 回からのずれは最大 165）、R の `future` は別の R プロセス（PID が違う）で動いたか、Perl の `fork` は 4 つのジョブが別々の子プロセスで走ったかまで見ています。

## 処理系は配布物を照合してから使う

新しく入れた処理系は、公式の配布物をチェックサムや署名で照合してから使いました。

- Zig 0.17.0: 公式の tarball を sha256 で照合
- Scala 3.9.0: Maven Central の jar を sha1 で照合し、警告をエラーにしてコンパイル。マージソートは 200 件の乱数入力で `sorted` の結果と比べた
- Lua 5.5.1 / 5.4.9: lua.org のソースを sha256 で照合してビルド。luacheck はリリースの PGP 署名を照合
- R 4.6.1: CRAN のパッケージの SHA1・署名・公証を確かめ、インストールせずに展開して実行
- Perl 5.44.0: cpan.org のソースを sha256 で照合してビルドし、`use warnings FATAL => 'all'` で実行

#34 で Lua・R・Perl を選んだのも、候補 9 言語のうち人気が上位で、公式の処理系を手元に用意して全問を検証できる 3 つだったからです。

手元に入れなかった Java（JDK 27）と C#（.NET 9）は Godbolt で、Kotlin は play.kotlinlang.org で実行しました。Dart は DartPad の API で静的解析と整形を確かめ、実行は Godbolt です。Godbolt の Scala は実行時に scala-library が無くて使えないため、Scala は手元に用意しています。

## 動かして見つかった誤り

#26 では既存の 3 問に誤りが見つかりました。

- `java-try`: `log.error(e)` は、SLF4J にも java.util.logging にも `error(Throwable)` が無くコンパイルできない。`log.error("process failed", e)` に直した
- `csharp-prop`: nullable を有効にすると CS8618 の警告が出ていた。`required` を付けた
- `bash-pipe`: `cat access.log | grep 404 | wc -l` は不要な `cat` を含むので、`grep 404 access.log | sort | uniq -c` にした

整形ツールにも従います。Dart の enhanced enum は `dart format` が値と本体の間に空行を入れますが、問題には空行を入れない決まりなので、カスケード記法の問題に差し替えました（#32）。

## 画面に収まるかも測る

正しいコードでも、画面からはみ出せば打てません。全問を実際のコードパネルに描画して高さを測り、新しい問題が既存の最大（375×667 で 512px、1280×800 で 567px）を超えないことを確かめています。Dart のアルゴリズムの問題は最初は編集距離でしたが、375×667 で既存の最大より 100px 高く、上のパネルに重なったので、繰り返し二乗法に差し替えました。Scala のマージソートもガード付きの `case` に書き換えて、既存の最大と同じ高さに収めています。#34 で足した 42 問の最大は 402px と 455px でした。

仕上げに、本番ビルドをヘッドレス Chrome で開き、新しい言語の問題を 1280×800 と 375×667 で最後まで打っています。375×667 ではタッチをエミュレーションし、ソフトキーボードと同じ `beforeinput` の経路で入力しました。

## 確かめられなかったもの

- PHP は構文の解析だけで、実行していない
- SwiftUI の `swift-view` は、`@State` マクロに Xcode が要るため未検証
- Flutter の 2 問は静的解析だけ。`dart-async` は本物の package:http に対して解析し、実行は同じ形の偽の `http` で行った
- Lua は PUC Lua 5.4 / 5.5 だけで、LuaJIT と Luau では動かしていない
- R の `mclapply` は fork を使うので、Windows では `mc.cores` が 1 より大きいとエラーになる（検証は macOS だけ）
- Scala は scalafmt を、Perl は Perl::Critic を通していない

どれも各 PR の本文に、未検証または限定的なものとして残してあります。

## 参考

- [snippet-sprint PR #26](https://github.com/tktk7l9/snippet-sprint/pull/26)（286 問・C の追加・既存 3 問の修正・490 チェック）
- [snippet-sprint PR #32](https://github.com/tktk7l9/snippet-sprint/pull/32)（Zig・Dart・Scala・記号ドリル・コードパネルの高さ）
- [snippet-sprint PR #34](https://github.com/tktk7l9/snippet-sprint/pull/34)（Lua・R・Perl・配布物の照合）
- [snippet-sprint の README](https://github.com/tktk7l9/snippet-sprint#readme)（23 言語・375 問）
