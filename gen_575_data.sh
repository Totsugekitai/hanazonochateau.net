#!/usr/bin/env bash

DATA_DIR='./data'
INDEX_MD='./content/575/_index.md'

BLAME_RAW_STR=$(git --no-pager blame -L 10 --line-porcelain $INDEX_MD)

while true
do
    read hash
    read author
    read author_mail
    read author_time
    read author_tz
    read committer
    read committer_mail
    read committer_time
    read committer_tz
    read summary
    read previous
    read filename
    read content
    if [ -z "$hash" ]; then
	break
    fi

    hash=$(echo ${hash} | awk '{print $1}')
    yomibito=$(echo ${author} | sed -r 's/^author (.*)$/\1/')
    yomibito_time=$(echo ${author_time} | sed -r 's/^author-time (.*)$/\1/')
    yomibito_tz=$(echo ${author_tz} | sed -r 's/^author-tz (.*)$/\1/')
    content=$(echo ${content} | sed -r 's/^ *- (.*)$/\1/')

    yomibito_tz=$(echo $yomibito_tz | sed -r 's/^(.)([0-9]{2})([0-9]{2})/\1\2:\3/')
    yomibito_date=$(date -d @$yomibito_time +%Y-%m-%dT%H:%M:%S)
    yomibito_date_with_tz=$(echo ${yomibito_date}${yomibito_tz})

    yomibito_text_body=$(git --no-pager log "$hash" -n 1 --pretty=format:"%b" -- $INDEX_MD)

    filename=$(sha256sum <(echo "$content") | awk '{print $1}')
    cat << EOS > "${DATA_DIR}/$filename".toml
commit_hash = "${hash}"
yomibito = "${yomibito}"
date = ${yomibito_date_with_tz}
content = "${content}"
commit_text_body = """
${yomibito_text_body}"""
EOS
done <<< ${BLAME_RAW_STR}
