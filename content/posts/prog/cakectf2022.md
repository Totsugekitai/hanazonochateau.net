---
title: "CakeCTF 2022 Writeup"
slug: cakectf2022
date: 2022-09-05T08:18:40+09:00
tags: [ "prog" ]
draft: false
---

CakeCTF 2022 に [DCDC](https://dcdcnation.com/) として参加し、 その内の kiwi という問題を解きました。
楽しかった一方、自分にとっては難しい問題が多く、まだまだ力をつける必要があるなと感じました。

## \[rev\] kiwi

バイナリとダミーのflag.txt、それに接続先が提示されます。
バイナリを起動してみるとプロンプトが表示され、正しいキーを入力するとフラグが表示されるようです。

最初に種明かしをすると、有効なキーを入力すると、そのキーで暗号化されたフラグが出力されます。
まず有効なキーのパターンを解析し、その後暗号化されたフラグを復号化するという二段構成になっています。

解析にはGhidraを用いました。

### 有効なキーのパターンを見つける

入力されたキーが有効か判定し、それを用いているのは `cakectf::EncryptionKey::decode` です。

関数内部に `set_key` と `set_magic` という関数があり、この関数たちを呼び出すことで暗号化の準備が完成します。
Ghidraでデコンパイルするとif文が入り組んでおり、このif文をかいくぐってこれらの関数を呼び出すようなキーを入力する必要があります。

まずは前半部分です。

```c
    while( true ) {
      cVar2 = kiwi::ByteBuffer::readVarUint(bytebuf,&local_34);
      if (cVar2 != '\x01') {
        uVar3 = 0;
        goto LAB_00106145;
      }
      if (local_34 != 2) break;  /* (1) */
      cVar2 = kiwi::ByteBuffer::readVarUint(bytebuf,&local_38);
      if (cVar2 != '\x01') {
        uVar3 = 0;
        goto LAB_00106145;
      }
      local_28 = (Array<unsigned_char> *)set_key(this,mempool,local_38); /* (2) */
      local_30 = (uchar *)kiwi::Array<unsigned_char>::begin(local_28);
      local_20 = (uchar *)kiwi::Array<unsigned_char>::end(local_28);
      for (; local_30 != local_20; local_30 = local_30 + 1) { /* (3) */
        local_18 = local_30;
        cVar2 = kiwi::ByteBuffer::readByte(bytebuf,local_30);
        if (cVar2 != '\x01') {
          uVar3 = 0;
          goto LAB_00106145;
        }
      }
    }
```

*(1)* の部分から、 `set_key` にたどり着くには `readVarUint` で `local_34` に対して2を出力する必要がありそうです。
`readVarUint` は内部で `readByte` という関数を呼び出してwhileループしています。
実験したら、 `readVarUint` は2文字ずつ読んで数値に変換する関数のようでした。
したがって最初の2文字は **02** でよさそうです。

*(2)* の `set_key` 内部は次のようになっています。

```c
EncryptionKey * __thiscall
cakectf::EncryptionKey::set_key(EncryptionKey *this,MemoryPool *param_1,uint param_2)
{
  //(...snip...)
  
  *(uint *)this = *(uint *)this | 2;
  AVar2 = kiwi::MemoryPool::array<unsigned_char>(param_1,param_2);

  // (...snip...)
  return this + 8;
}
```

やってることは、EncryptionKey内部のフラグを立てるかなんかして、MemoryPoolにArrayを作っています。
`param_2` が要素数らしいです。

次の入力は要素数が入るらしいので、とりあえず **08** とかにしておきます。

*(3)* のforループでさっきのArrayに値を読み込んで格納しているっぽいですね。
さっき要素数8にしたので、とりあえず8個分ゼロで埋めておきましょう。
**0000000000000000** で。

**0123456789abcdef** とかでもいいのですが、後々面倒になります。
理由は読み進めるとわかります。

このwhile文にはもう用はないので *(1)* で2以外をあたえてbreakします。
何を与えるといいかというのは後半部に書いてあります。

```c
    if (local_34 < 3) {
      if (local_34 == 0) {
        uVar3 = 1;         /* (10) */
        goto LAB_00106145;
      }
      if (local_34 == 1) { /* (4) */
        cVar2 = kiwi::ByteBuffer::readVarUint(bytebuf,(uint *)(this + 0x18));
        if (cVar2 != '\x01') {
          uVar3 = 0;
          goto LAB_00106145;
        }
        set_magic(this,(uint *)(this + 0x18)); /* (5) */
        goto LAB_00105fd5;
      }
    }
```

`set_magic` にも入っておきたいので、 *(4)* から、次の値は **01** にしましょう。

*(5)* の `set_magic` は次のようになっています。

```c
void __thiscall cakectf::EncryptionKey::set_magic(EncryptionKey *this,uint *param_1)
{
  *(uint *)this = *(uint *)this | 1;
  *(uint *)(this + 0x18) = *param_1;
  return;
}
```

`EncryptionKey` の内部ビットを立てて、 `param_1` の値を `EncryptionKey` 内部にコピーしています。

さて、続きに何を入れるかですが、実は先の処理を見る必要があります。

`main` 内部の続きの `checkMessage` 関数を見ます。

```c
undefined8 checkMessage(EncryptionKey *param_1)

{
  uint uVar1;
  long lVar2;
  undefined8 uVar3;
  int *piVar4;
  Array<unsigned_char> *this;
  
  lVar2 = cakectf::EncryptionKey::magic(param_1);
  if (lVar2 == 0) {
    uVar3 = 1;
  }
  else {
    piVar4 = (int *)cakectf::EncryptionKey::magic(param_1);
    if (*piVar4 == 0xcafec4f3) { /* (6) */
      lVar2 = cakectf::EncryptionKey::key(param_1);
      if (lVar2 == 0) {
        uVar3 = 1;
      }
      else {
        this = (Array<unsigned_char> *)cakectf::EncryptionKey::key(param_1);
        uVar1 = kiwi::Array<unsigned_char>::size(this);
        if (uVar1 < 8) {
          uVar3 = 1;
        }
        else {
          uVar3 = 0;
        }
      }
    }
    else {
      uVar3 = 1;
    }
  }
  return uVar3;
}
```

*(6)* の `cafec4f3` がもう怪しすぎますね。

`magic` 関数の戻り値が `cafec4f3` になればよさそうです。
`magic` 関数は以下のようになっています。

```c
EncryptionKey * __thiscall cakectf::EncryptionKey::magic(EncryptionKey *this)
{
  EncryptionKey *pEVar1;
  
  if ((*(uint *)this & 1) == 0) {
    pEVar1 = (EncryptionKey *)0x0;
  }
  else {
    pEVar1 = this + 0x18;
  }
  return pEVar1;
}
```

`EncryptionKey` の1ビット目が立っていればオフセット0x18の値を返し、そうでなければ0を返します。
このビットは `set_magic` で立ててあるので大丈夫です。

これより、次に入力する文字列は `cafec4f3` ...かと思いきや、ちょっとひねりが入れてあります。
`readVarUint` を見てみましょう。

```c
undefined8 __thiscall kiwi::ByteBuffer::readVarUint(ByteBuffer *this,uint *param_1)
{
  // (...snip...)

  local_11 = 0;
  *param_1 = 0;
  do {
    cVar1 = readByte(this,&local_12);
    if (cVar1 != '\x01') {
      uVar2 = 0;
      goto LAB_00104ddd;
    }
    *param_1 = *param_1 | (local_12 & 0x7f) << (local_11 & 0x1f); /* (8) */
    local_11 = local_11 + 7;                                      /* (9) */
  } while (((char)local_12 < '\0') && (local_11 < 0x23));
  uVar2 = 1;
LAB_00104ddd:
  // (...snip...)
}
```

*(8)* で読んだ数値を0x7fで論理積を取り、さらに `local_11` でシフトしています。
また *(9)* を見ると `local_11` は7ビットずつシフトしています。

これらを考慮に入れると、数値0xcafec4f3を `magic` 関数から出力させるには、計算すると、 **f389fbd78c** を入力する必要があることがわかります。
この辺は紙と鉛筆で計算しました。

最後に `decode` 関数を脱出するには *(10)* から **00** を入力します。

これまでの入力を合わせると、 **0208000000000000000001f389fbd78c00** となります。
これを入力すると、無事暗号化されたフラグが出力されます。

サーバに接続し、上記の入力をすると、以下のフラグが返ってきました。

```
bc9f9699b8aebf8380c5aa9ac0c195af9bdeb29c99d99fdb8992baa38c8d868cba81bbaeebb786aba3e2bbb0e7a0b5e1b5ffa3ab94afbffbb5bfb1acf2aca6bd
```

### 暗号化されたフラグを復号する

さて、暗号化されたフラグが手に入ったところで第二ラウンド開始です。
暗号化処理は `main` 内の `encryptFlag` で行っています。
以下がデコンパイル結果です。

```c
basic_string * encryptFlag(basic_string *enc_flag,Array *raw_flag)
{
  // (...snip...)
  std::vector<unsigned_char,std::allocator<unsigned_char>>::vector
            ((vector<unsigned_char,std::allocator<unsigned_char>> *)enc_flag);
  std::__cxx11::basic_string<char,std::char_traits<char>,std::allocator<char>>::size();
                    /* try { // try from 0010649e to 00106536 has its CatchHandler @ 00106541 */
  std::vector<unsigned_char,std::allocator<unsigned_char>>::reserve((ulong)enc_flag);
  local_28 = 0;
  while( true ) {
    uVar3 = std::__cxx11::basic_string<char,std::char_traits<char>,std::allocator<char>>::size();
    if (uVar3 <= local_28) break;
    pcVar4 = (char *)std::__cxx11::basic_string<char,std::char_traits<char>,std::allocator<char>>::
                     operator[]((ulong)raw_flag);
    cVar1 = *pcVar4;
    lVar5 = kiwi::Array<unsigned_char>::data(in_RDX); /* (12) */
    uVar2 = kiwi::Array<unsigned_char>::size(in_RDX);
    local_30 = (long)(int)((((uint)*(byte *)(local_28 % (ulong)uVar2 + lVar5) ^ (int)cVar1) & 0xff |
                           (uint)(uint3)(cVar1 >> 7) << 8) ^ 0xff) ^ local_28; /* (11) */
    std::vector<unsigned_char,std::allocator<unsigned_char>>::emplace_back<unsigned_long>
              ((vector<unsigned_char,std::allocator<unsigned_char>> *)enc_flag,&local_30);
    local_28 = local_28 + 1;
  }
  // (...snip...)
  return enc_flag;
}
```

while内の *(11)* が暗号化処理の核です。

`lVar5` と `uVar2` はコードをじっとにらむとあの **0000000000000000** のデータとサイズということがわかります。
また、 `(uint)*(byte *)(local_28 % (ulong)uVar2 + lVar5)` あたりは `lVar5[local_28 % (ulong)uVar2]` と見えます。
ここで `lVar5` は全て0なのでちょっと楽になり、
最終的には `((0 ^ cVar1) & 0xff | (uint)(uint3)(cVar1 >> 7) << 8) ^ 0xff) ^ i` (ここで `i` はループ変数)が暗号化処理だとわかります。

これらの情報を基に `solve.cpp` を書きました。

```cpp
#include <cstdio>
#include <string>
#include <vector>
#include <iostream>

using namespace std;

const string enc_flag = "bc9f9699b8aebf8380c5aa9ac0c195af9bdeb29c99d99fdb8992baa38c8d868cba81bbaeebb786aba3e2bbb0e7a0b5e1b5ffa3ab94afbffbb5bfb1acf2aca6bd";

const string fake_flag = "FakeCTF{***** REDUCTED *****}";
const string fake_enc_flag = "b99f9699b8aebf83dddcdfded9d2a3b5abbbaeb8aeaec9c2cdcccfce9e";

uint8_t read_byte(const string &enc, uint32_t idx)
{
    char c1 = enc[idx];
    char c2 = enc[idx + 1];
    string s = string{c1, c2};
    uint8_t i = stoi(s, nullptr, 16);
    return (uint8_t)i;
}

int main()
{
    const string &enc_flag_ref = enc_flag;

    vector<uint8_t> ans = {};
    for (uint32_t i = 0; i < (enc_flag_ref.size() / 2); i++)
    {
        char unenc = 0;
        uint8_t enc = read_byte(enc_flag_ref, i * 2);
        for (char c = 0x00; c < 0x7f; c++)
        {
            if (enc == ((((0 ^ c) & 0xff | (uint32_t)(uint32_t)(c >> 7) << 8) ^ 0xff) ^ i))
            {
                unenc = c;
            }
        }
        ans.push_back((uint8_t)unenc);
    }
    for (int i = 0; i < ans.size(); i++)
    {
        printf("%c", ans[i]);
    }
    printf("\n");
    return 0;
}
```

上記の `solve.cpp` をコンパイルし実行するとフラグゲットです。

`CakeCTF{w3_n33d_t0_pr3v3nt_Google_fr0m_st4nd4rd1z1ng_ev3ryth1ng}`

おしまい。