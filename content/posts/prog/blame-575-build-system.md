---
title: "575のページを詠み人と日付が表示されるようにした"
slug: blame-575-build-system
date: 2023-07-06T21:35:04+09:00
tags: [ "prog" ]
draft: false
---

## やった

- [575のページ](/575)において、各575の隣に `by John Doe 20xx-xx-xx` のように、詠み人と日付を表示するようにした
- 文字列は575を追加した該当のコミット履歴にリンクされている
  - あとでお好きな575の末尾をクリックしてみてください

## アイデア

先日あざらし君[^azrsh]とご飯を食べていて、Twitterが爆発した話になったときに、自分が最強の個人サイトを作りたいといった旨を述べたところ、彼から「575のページに詠み人とかも載せてほしい」といった感じの言葉を聞きました。
わざわざ書き足すのもダルいな～と思ったのですが、追加で「 **Gitのblameから取ってくればいい** 」というアイデアを聞き面白そうだと思い、解散した後、夜なべして作りました。

[^azrsh]: https://azr.sh/

## 実装

コードは [Totsugekitai/hanazonochateau.net](https://github.com/Totsugekitai/hanazonochateau.net) に置いてあります。

処理の流れとしては、次のようになります。

1. [content/575/_index.md](https://github.com/Totsugekitai/hanazonochateau.net/blob/main/content/575/_index.md) に575を追加し、コミット
2. [build.py](https://github.com/Totsugekitai/hanazonochateau.net/blob/main/build.py) で `git blame` を行い[^gitpython]、取得した情報を `data/blame_575.json` に出力
3. 出力した情報を [layouts/section/575.html](https://github.com/Totsugekitai/hanazonochateau.net/blob/main/layouts/section/575.html) で利用し[^data_dir]、最終的なHTMLを生成

また、取得した情報の中にはコミットハッシュも含まれているので、リポジトリのURLに食わせれば簡単に該当コミットに飛ばすことができます。

[^gitpython]: コマンドを直接叩いているわけではなく、 [GitPython](https://github.com/gitpython-developers/GitPython) というモジュールを用いてblameしている
[^data_dir]: `data/` 以下に置かれたjsonはテンプレートエンジンによって読み込まれ、テンプレート内部で変数としてアクセスできる( https://gohugo.io/templates/data-templates/#the-data-folder )

## 感想

やはり、詠み人や日付が表示されるとグッと豪華に見えますね。

先程 n01e0[^tori] [^tori_pronunciation] さんが早速新たな575をコミットしてくれました。
自分以外の詠み人が表示されると嬉しいです。

皆さん気軽にプルリク出してください。

[^tori]: https://feneshi.co/
[^tori_pronunciation]: ハンドルネームの発音は不明だが、勝手に「とりさん」と呼んでいる
