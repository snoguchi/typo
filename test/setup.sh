#!/bin/sh

cd `dirname $0`

mkdir -p files
cd files

make_test_files() {
  kb=$1
  dd bs=1024 count=${kb} if=/dev/urandom of=${kb}kb.dat
  cp ${kb}kb.dat ${kb}kb_copy.dat
  cp ${kb}kb.dat ${kb}kb_modify.dat
  cp ${kb}kb.dat ${kb}kb_truncate.dat
  echo -n "hoge" | dd of=${kb}kb_modify.dat bs=1 seek=100 conv=notrunc
  truncate -s 1000 ${kb}kb_truncate.dat
  cmp ${kb}kb.dat ${kb}kb_copy.dat
  cmp ${kb}kb.dat ${kb}kb_modify.dat
  cmp ${kb}kb.dat ${kb}kb_truncate.dat
}

make_test_files 1
make_test_files 128
