while read url; do
    while [[ "$(pgrep -fc wget)" -gt 9 && $c -gt 10 ]]; do sleep 1; done;
    ((c++));
    wget $url
done
