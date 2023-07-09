# hanazonochateau.net

- ssg: hugo
- theme: etch
- domain: cloudflare
- comment form: google forms

## 575を追加したい人向け情報

### 575の記載(required)

`content/575/_index.md` に書き散らしてコミットし、プルリクを出してください。
コミット時のGitのユーザ名、日付とともに晒されます。

### 解説やお気持ちの記載(optional)

575の解説テキストの表示に対応しました。
**コミットメッセージの3行目以降** に解説やお気持ちを書いておくと、575の左に矢印が出現し、それをクリックすると解説が表示されます。

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

### 内部実装について

内部的には `git blame` してauthor情報やら日時やらを取ってきて、ビルド時に埋め込んでいます。
詳細は `build.py` を見よ。
