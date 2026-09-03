LIBDIR := lib
-include $(LIBDIR)/main.mk

$(LIBDIR)/main.mk:
ifneq (,$(shell grep "path *= *$(LIBDIR)" .gitmodules 2>/dev/null))
	git submodule sync
	git submodule update --init
else
ifneq (,$(wildcard $(ID_TEMPLATE_HOME)))
	ln -s "$(ID_TEMPLATE_HOME)" $(LIBDIR)
else
	git clone -q --depth 10 -b main \
	    https://github.com/martinthomson/i-d-template $(LIBDIR)
endif
endif

# ---- Submission build: idnits-clean RFCXML v3 -------------------------------
# kramdown-rfc 1.7.x emits RFCXML *v2* regardless of `v: 3` in the front matter
# or the -3 flag, and v2 elements (spanx/list/texttable) are idnits errors. So
# generate, upconvert with xml2rfc, then post-process. Variables are prefixed to
# avoid colliding with i-d-template's lib/main.mk.
#
# Requires: kramdown-rfc (gem), xml2rfc (pip install xml2rfc).
SUB_SRC     := draft-riedl-moq-ad-creative-signaling.md
SUB_DOCNAME := $(shell sed -n 's/^docname: *//p' $(SUB_SRC))

.PHONY: submission submission-txt submission-check

submission: $(SUB_DOCNAME).xml

$(SUB_DOCNAME).xml: $(SUB_SRC) scripts/postprocess-v3.py
	@command -v xml2rfc >/dev/null || { echo "xml2rfc not found: pip install xml2rfc"; exit 1; }
	kramdown-rfc $(SUB_SRC) > $@.v2.tmp
	xml2rfc --v2v3 $@.v2.tmp -o $@
	python3 scripts/postprocess-v3.py $@
	@rm -f $@.v2.tmp
	@echo "built $@ (RFCXML v3) - upload at https://datatracker.ietf.org/submit/"

submission-txt: $(SUB_DOCNAME).txt

$(SUB_DOCNAME).txt: $(SUB_DOCNAME).xml
	xml2rfc --text $< -o $@

# Requires the idnits v3 CLI: npm install -g @ietf-tools/idnits
submission-check: $(SUB_DOCNAME).xml
	idnits $(SUB_DOCNAME).xml
