# hanazonochateau.net

- ssg: hugo
- theme: etch
- domain: cloudflare
- comment form: google forms

## 575を追加したい人向け情報

`content/575/_index.md` に書き散らしてコミットし、プルリク出してください。
コミット時のGitのユーザ名、日付とともに晒されます。

内部的には `git blame` してauthor情報やら日時やらを取ってきて、ビルド時に埋め込んでいます。
詳細は `build.py` を見よ。
