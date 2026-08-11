# Ad Creative Signaling over the MSF Event Timeline

This is the working area for the individual Internet-Draft, "Ad Creative Signaling over the
MSF Event Timeline".

* [Editor's Copy](https://riedlse.github.io/draft-riedl-moq-ad-creative-signaling/#go.draft-riedl-moq-ad-creative-signaling.html)
* [Datatracker Page](https://datatracker.ietf.org/doc/draft-riedl-moq-ad-creative-signaling)
* [Individual Draft](https://datatracker.ietf.org/doc/html/draft-riedl-moq-ad-creative-signaling)
* [Compare Editor's Copy to Individual Draft](https://riedlse.github.io/draft-riedl-moq-ad-creative-signaling/#go.draft-riedl-moq-ad-creative-signaling.diff)

> The Datatracker links above 404 until the first submission. The Editor's Copy is live as soon
> as the GitHub Actions build completes.

## What this document does

[SCTE35-MOQ] carries *placement opportunities* on an MSF Event Timeline track — break windows
and splice conditioning, which is what SCTE-35 was built for. It deliberately does not describe
*what plays inside* those windows.

On HLS and DASH that gap is filled at the manifest: a packager or stitcher decorates each
session's playlist with creative identity and tracking metadata. On a one-to-many pub/sub
transport there is no per-session manifest to decorate — every subscriber receives the same
cached objects — so anything a client needs at render time (which creative is this, which
beacons fire at which quartiles, which verification SDK to bootstrap) must arrive in-band, on
the shared timeline, ahead of the splice.

This document defines an Event Timeline event class carrying [SVTA 2053-1] Version 2 carriage
envelopes, and registers one entry in the "MSF Event Timeline Types" registry established by
draft-ietf-moq-msf §14.2.

It is a **companion** to
[draft-wilaw-moq-scte35-event-timeline](https://datatracker.ietf.org/doc/draft-wilaw-moq-scte35-event-timeline),
which registers entries in that same registry. Kept as a separate document at the request of
that draft's author.

## Contributing

See the
[guidelines for contributions](https://github.com/riedlse/draft-riedl-moq-ad-creative-signaling/blob/main/CONTRIBUTING.md).

Contributions can be made by creating pull requests.
The GitHub interface supports creating pull requests using the Edit (✏) button.

## Command Line Usage

Formatted text and HTML versions of the draft can be built using `make`.

```sh
$ make
```

Command line usage requires that you have the necessary software installed. See
[the instructions](https://github.com/martinthomson/i-d-template/blob/main/doc/SETUP.md).
