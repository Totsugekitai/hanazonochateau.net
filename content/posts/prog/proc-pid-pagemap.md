---
title: "/proc/$pid/pagemapを読みたいときにハマったポイント"
slug: proc-pid-pagemap
date: 2022-02-18T22:28:36+09:00
tags: [ "prog" ]
draft: true
---

linuxでは `/proc/$pid/pagemap` でプロセスの仮想メモリ領域がどのように物理メモリにマップされているかを調べることができます。
しかし、いくつか注意しないと正確に読めないのでそれについて解説します。

# データはバイナリ形式で読み出す必要がある

普通に `cat /proc/self/pagemap` とかやっても読み出すことはできません。
このファイルはバイナリファイルで、ルールに従ってバイナリを読みださなければいけません。

ルールは [pagemap.txt](https://github.com/torvalds/linux/blob/v4.9/Documentation/vm/pagemap.txt) に書かれています。
8バイトずつ読み出します。
Bits 0-54が物理ページのフレーム番号です。

# seekして正しい位置から読み出す

正しいオフセットから `read` しないといけません。
オフセットの計算は次のように行います。
[仮想アドレスから物理アドレスを求める](https://mmi.hatenablog.com/entry/2017/05/01/215921)から必要な部分を抜粋します。

```c
unsigned long
virt2phy(const void *virtaddr)
{
    ...

    fd = open("/proc/self/pagemap", O_RDONLY);
    ...

    virt_pfn = (unsigned long)virtaddr / page_size;
    offset = sizeof(uint64_t) * virt_pfn;
    if (lseek(fd, offset, SEEK_SET) == (off_t) -1) {
        ...
    }

    retval = read(fd, &page, PFN_MASK_SIZE);
    ...

    ...
    physaddr = ((page & 0x7fffffffffffffULL) * page_size)
        + ((unsigned long)virtaddr % page_size);

    return physaddr;
}
```

PFNというのはPage Frame Numberの頭文字っぽいです。

# `CAP_SYS_ASMIN` 権限で読み出す

`sudo` しないと物理アドレスが入っているBits 0-54は0埋めされます。
[Reason: information about PFNs helps in exploiting Rowhammer vulnerability.](https://github.com/torvalds/linux/blob/v4.9/Documentation/vm/pagemap.txt#L28)とあります、
Rowhammerアタックというやつですね。
まあ危ないんで気を付けて扱いましょう。
