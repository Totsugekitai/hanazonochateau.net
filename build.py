import re
import subprocess
from dataclasses import dataclass
from dataclasses_json import dataclass_json
from datetime import datetime
from git import *
from hashlib import sha256
from typing import List


@dataclass_json
@dataclass
class LineInfo:
    author: str
    commit_hash: str
    date: str
    line: str
    line_number: int
    guid: str
    okimochi: str


def get_line_info_list(file: str) -> List[LineInfo]:
    repo = Repo(".")
    assert not repo.bare

    li_head = re.compile('^- ')

    with open(file, 'r') as f:
        lines_575 = f.readlines()

    line_info_list = []

    for blame_entry in repo.blame_incremental(rev='HEAD', file=file):
        commit = repo.commit(blame_entry.commit)
        author = str(commit.author)
        date = str(commit.authored_datetime.strftime('%Y-%m-%d %H:%M:%S %z'))
        linenos = blame_entry.linenos
        commit_msg_lines = commit.message.split('\n')
        if len(commit_msg_lines) < 3:
            okimochi = ''
        else:
            commit_msg_lines = commit_msg_lines[2:]
            okimochi = '\n'.join(commit_msg_lines).strip()

        for i in linenos:
            line = lines_575[i-1].rstrip()
            if bool(li_head.match(line)):
                line = line[2:]  # `- ` を除去
                commit_hash = commit.hexsha
                guid = sha256(("%s%s%s%s" % (line, author, date,
                                             commit_hash)).encode()).hexdigest()
                line_info = LineInfo(author, commit_hash,
                                     date, line, i, guid, okimochi)
                line_info_list.append(line_info)

    return line_info_list


if __name__ == '__main__':
    line_info_list = get_line_info_list('./content/575/_index.md')
    data = LineInfo.schema().dumps(line_info_list, many=True,
                                   indent=4, ensure_ascii=False)

    with open('data/blame_575.json', 'w') as f:
        f.write(data)

    subprocess.check_call("hugo", shell=True)
