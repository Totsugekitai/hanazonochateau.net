+++
date = '2022-05-08T16:43:39+09:00'
draft = true
slug = 'vt-x'
tags = ['prog']
title = 'Intel CPUの仮想化機構についてメモ'
+++

最近 [自作VMM](https://github.com/Totsugekitai/tvisor) を始めました。
その過程でIntel CPUの仮想化機構について調べたので、整理も兼ねてメモを残しておきます。

## VMX Operation

Intelの仮想化機構を利用するには、まずVMX命令を使えるようにする必要があります。
VMMとVMX命令の関係は以下の図のような感じです。

![VMMとVMX命令の関係図](./vmx_interaction.png "図はIntel SDMより引用")

VMX命令を使えるようにするには、 `vmxon` 命令を用います。
`vmxon` 命令を発行する前に `CR4.VMXE[bit 13] = 1` であることを確認しましょう。
例外が飛んできます。

`vmxon` 命令は、オペランドにVMXON Regionのメモリアドレスを取ります。
VMXON Regionとは、 `vmxon` 命令のために必要なメモリ領域です。
4kBアライメントされ、先頭バイトにリビジョンIDがあり、あとは0埋めしておけば良さそうです。
リビジョンIDは `IA32_VMX_BASIC` MSRから収穫できます。

## VMCS(Virtual Machine Control Structure)

VMCSは、ゲストとホストの状態や、VM Exitの理由などを記録する領域です。
4kBアライメントされ、最大で4kBの領域を取ります。
中身は以下の図のようになっています。

![VMCSの早見表1](./VMCS-page-layout-1.jpg "VMCS早見表1")

![VMCSの早見表2](./VMCS-page-layout-2.jpg "VMCS早見表2")

基本的には、 `vmread` と `vmwrite` で読み書きすることになります。

![VMCSの状態遷移表](./vmcs_state.png "VMCSは状態を持つ")