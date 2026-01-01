# hanazonochateau.net

- ssg: hugo
- theme: original
- domain: cloudflare
- comment form: google forms

## 事前準備

`mise` を利用して環境構築が行えます。

```
mise i
```

で必要なソフトウェアがインストールできます、 `mise` の使い方はググってください。

## ローカルで確認

```
hugo server
```

## 575を追加したい人向け情報

### 575の記載(required)

`content/575/_index.md` に書き散らしてコミットし、プルリクを出してください。
コミット時のGitの **Author名・日付** とともに晒されます。

### 解説やお気持ちの記載(optional)

575の解説テキストの表示に対応しました。
**コミットメッセージの3行目以降** に解説やお気持ちを書いておくと、575の下にテキストが表示されます。

以下に例を示します。

```
add 575

休日の午後に旅行先を思いついても動き出すにはもう遅い、そんなタイミングは虚しさが発生します。
# Please enter the commit message for your changes. Lines starting
# with '#' will be ignored, and an empty message aborts the commit.
#
# On branch add-575
# Changes to be committed:
#       modified:   content/575/_index.md
#
```

上記の例では、

> 休日の午後に旅行先を思いついても動き出すにはもう遅い、そんなタイミングは虚しさが発生します。

が、解説テキストに該当します。

### 内部実装について

内部的には `git blame` してauthor情報やら日時やらを取ってきて、ビルド時に埋め込んでいます。
詳細は `gen_575_data.sh` を見よ。

### 手元でビルド

```sh
$ ./gen_575_data.sh
```
