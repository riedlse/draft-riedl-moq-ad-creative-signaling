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
#
# The source's docname is "<name>-latest", as i-d-template expects (its lint-docname check
# fails otherwise). SUB_REV is the revision being submitted; it replaces "-latest" in the
# source on the way into kramdown-rfc, so the submission file carries the real number.
# Bump it after each submission. Override on the command line: make submission SUB_REV=02
SUB_REV     ?= 01
SUB_SRC     := draft-riedl-moq-ad-creative-signaling.md
SUB_LATEST  := $(shell sed -n 's/^docname: *//p' $(SUB_SRC))
SUB_DOCNAME := $(patsubst %-latest,%-$(SUB_REV),$(SUB_LATEST))

.PHONY: submission submission-txt submission-html submission-check

submission: $(SUB_DOCNAME).xml

$(SUB_DOCNAME).xml: $(SUB_SRC) scripts/postprocess-v3.py Makefile
	@command -v xml2rfc >/dev/null || { echo "xml2rfc not found: pip install xml2rfc"; exit 1; }
	sed 's/$(SUB_LATEST)/$(SUB_DOCNAME)/g' $(SUB_SRC) | kramdown-rfc > $@.v2.tmp
	xml2rfc --v2v3 $@.v2.tmp -o $@
	python3 scripts/postprocess-v3.py $@
	@rm -f $@.v2.tmp
	@echo "built $@ (RFCXML v3) - upload at https://datatracker.ietf.org/submit/"

submission-txt: $(SUB_DOCNAME).txt

$(SUB_DOCNAME).txt: $(SUB_DOCNAME).xml
	xml2rfc --text $< -o $@

submission-html: $(SUB_DOCNAME).html

$(SUB_DOCNAME).html: $(SUB_DOCNAME).xml
	xml2rfc --html $< -o $@

# Requires the idnits v3 CLI: npm install -g @ietf-tools/idnits
submission-check: $(SUB_DOCNAME).xml
	idnits $(SUB_DOCNAME).xml
