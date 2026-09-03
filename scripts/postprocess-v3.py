#!/usr/bin/env python3
"""Post-process xml2rfc --v2v3 output into an idnits-clean submission file.

Two fixes, both artifacts of the kramdown-rfc -> xml2rfc pipeline rather than
anything in the Markdown source:

  * kramdown-rfc emits `<?line N?>` processing instructions for error mapping.
    idnits reports these as LINE_PI.
  * xml2rfc writes the XML declaration as <?xml version='1.0'
    encoding='utf-8'?>. That is valid, but encoding sniffers that match
    encoding="UTF-8" literally report INVALID_ENCODING / "detected null" on
    a file this close to pure ASCII, so normalize the quoting and case.
  * kramdown-rfc wraps both reference sections in an outer
    `<references><name>References</name>`. idnits reports the wrapper's name as
    INVALID_REFERENCES_NAME, expecting Normative/Informative at that level.

Idempotent: running it twice is a no-op.
"""
import io
import re
import sys

WRAPPER = re.compile(
    r'<references anchor="sec-combined-references">\s*<name>References</name>\s*'
)


def main(path):
    s = io.open(path, encoding="utf-8").read()
    original = s

    s = re.sub(
        r"^<\?xml[^>]*\?>",
        '<?xml version="1.0" encoding="UTF-8"?>',
        s,
        count=1,
    )

    line_pis = len(re.findall(r"<\?line[^>]*\?>", s))
    s = re.sub(r"[ \t]*<\?line[^>]*\?>\n?", "", s)

    flattened = False
    if WRAPPER.search(s):
        s = WRAPPER.sub("", s, count=1)
        # Drop the wrapper's now-unmatched closing tag, which is the last
        # </references> before </back>.
        close = s.rfind("</references>")
        back = s.find("</back>")
        if close != -1 and close < back:
            s = s[:close] + s[close + len("</references>"):]
            flattened = True

    if s != original:
        io.open(path, "w", encoding="utf-8").write(s)

    print(
        f"postprocess-v3: {path}: stripped {line_pis} line PI(s), "
        f"references wrapper {'flattened' if flattened else 'not present'}"
    )


if __name__ == "__main__":
    if len(sys.argv) != 2:
        sys.exit("usage: postprocess-v3.py <file.xml>")
    main(sys.argv[1])
