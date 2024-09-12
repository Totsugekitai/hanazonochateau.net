+++
date = '2023-09-05T19:37:34+09:00'
draft = false
slug = 'operating-system-in-1000-lines-rs'
tags = ['prog']
title = '「Writing an OS in 1000 Lines」をRISC-V 64bit向けにRustで書いた'
+++

[seiya nutaさん](https://seiya.me/) という方が書かれた、 [Writing an OS in 1000 Lines](https://operating-system-in-1000-lines.vercel.app) という教材があります。

C言語を用いて、1000行未満で、

- 素朴なコンテキストスイッチ
- ページング
- ユーザーモード
- コマンドラインシェル
- ディスクデバイスドライバ
- ファイルの読み書き

を実装するという驚異的な教材です。

今回はこの教材のカーネル部分をRustで再実装する、ということを行ってみました。
また、教材が取り扱うアーキテクチャがRISC-V 32bitだったので、64bit化もしてみました。

リポジトリは [こちら](https://github.com/Totsugekitai/kanios) です。
`./run.sh` すれば立ち上がります。

## 教材から変更した部分

教材から次の部分を変更しました。

1. 32bitから64bitへ変更
2. シェルをELFのままtarファイルシステムに詰め込み、ヘッダを解釈してロードする
3. ユーザーランドのバイナリ生成において、clangからgccへ変更

1と2は自分の好みでこのように変更しました。
3は後述します。

## 大変だった部分・詰まった部分

### `static mut` だらけ、 `unsafe` だらけ

コードを見てもらうとわかるのですが、 `static mut` でグローバル変数をひたすら定義し、 `unsafe` ブロックを使いまくって操作しています。

今回はシングルコアで、プリエンプティブマルチタスクなので問題ないですが、ノンプリエンプティブマルチタスクやマルチコアを行い始めると多分大変なことになりそうです。

### 64bit向け命令

RISC-Vについて詳しくなかったので、アセンブリを移植する際詰まりました。

具体的には、32bitの読み書き命令である `sw / lw` 命令をそのまま書いてしまい、なんかレジスタの上半分が壊れている、といったことが起きました。
調べると `sd / ld` 命令が64bitの読み書きに使えることが分かったのですが、その存在自体を知らなかったので、気づくまで時間を浪費してしまいました。

x86のノリで `mov` ってやってオペランドのレジスタ幅は良い感じにしてくれる、というわけではないんだなあ、と思いました。

### VirtIOドライバ

VirtIOについてほぼ知らなかったので、移植しながら「この部分はなぜこうなっているんだ…？」という部分を調べました。

一番困ったのは教材の [virtqueueの構造体の部分](https://github.com/nuta/operating-system-in-1000-lines/blob/main/kernel.h#L116C1-L123C27) です。

```c
struct virtio_virtq {
    struct virtq_desc descs[VIRTQ_ENTRY_NUM];
    struct virtq_avail avail;
    struct virtq_used used __attribute__((aligned(PAGE_SIZE)));
    int queue_index;
    volatile uint16_t *used_index;
    uint16_t last_used_index;
} __attribute__((packed));
```

上記の `used` というフィールドが `PAGE_SIZE` にアラインメントされていて、これが調べてもよくわからなかったです。
[Androidカーネルのドキュメントのコード例](https://android.googlesource.com/kernel/common/+/659c36fcda403013a01b85da07cf2d9711e6d6c7/Documentation/virtual/virtio-spec.txt#363) にそれっぽいことが書いてあったのですが、あまり確かな情報が得られませんでした。

また、Rustで書く際に、構造体のフィールド単位でアラインメントを指定する、ということができませんでした。
なので、苦肉の策として [パディングを入れることで解決](https://github.com/Totsugekitai/kanios/blob/main/src/virtio_blk.rs#L74C1-L83C2) しました。

```rust
#[repr(C, packed)]
#[derive(Debug)]
pub struct Virtq {
    desc: [VirtqDesc; VIRTQ_ENTRY_NUM], // size(0x100), align(0x1000)
    avail: VirtqAvail,                  // size(0x26)
    pad: [u8; 0xeda],                   // size(0x1000 - (0x100 + 0x26) = 0xeda)
    used: VirtqUsed,                    // size(_), align(0x1000)

    queue_idx: u32,
    used_idx: *mut u16,
    last_used_idx: u16,
}
```

### ユーザーランドの `printf` がバグる

ユーザーランドもRustで書こうとしたのですが、変更2でバイナリをtarに詰め込もうとした結果、サイズが爆発しました。
そこで、カーネル側のバッファサイズを増やして対処しようとしたら、コンパイラがなんか怒り出しました。
これらの理由から、ユーザーランドはCで書くことにしました。

しかし、教材の `printf` の実装がバグります。
呼び出し箇所で変なアドレスを参照して、全く別の文字列が表示されるという現象が起きました。

色々デバッグした結果、やっぱり生成されるコードがおかしく、もしやと思いclangからgccにコンパイラを変更すると、無事正しい文字列が表示されるようになりました。
これにはびっくり…（もしかしたらコンパイラのオプションが間違っていたのかもしれませんが）

## 感想

まず素晴らしい教材を作成していただいたseiyaさんに感謝します。

seiyaさん的には3日くらいを想定していたようですが、いろいろ引っかかって、なんだかんだで5日かかってしまいました。
理論としては知っている内容でも、いざ実装するとなるとなかなか難しいものもあるということが再確認できました。
また、VirtIOなど、自分にとっては新しい知識も得ることができたのでとても良かったです。
