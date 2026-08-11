---
title: "Ad Creative Signaling over the MSF Event Timeline"
abbrev: "MSF Ad Creative Signaling"
docname: draft-riedl-moq-ad-creative-signaling-latest
category: info
submissiontype: IETF
consensus: true

v: 3
ipr: trust200902
area: "Web and Internet Transport"
workgroup: "Media Over QUIC"
keyword:
 - media over quic
 - moq
 - msf
 - event timeline
 - advertising
 - ad signaling
 - ssai
 - beacon

stand_alone: yes
smart_quotes: no
pi: [toc, sortrefs, symrefs]

venue:
  group: "Media Over QUIC"
  type: "Working Group"
  mail: "moq@ietf.org"
  arch: "https://mailarchive.ietf.org/arch/browse/moq/"
  github: "riedlse/draft-riedl-moq-ad-creative-signaling"
  latest: "https://riedlse.github.io/draft-riedl-moq-ad-creative-signaling/"

author:
 -
    ins: S. Riedl
    fullname: Steven Riedl
    organization: Paramount
    email: steven.riedl@pluto.tv

normative:
  MSF: I-D.ietf-moq-msf
  RFC8259:
  SVTA2053:
    title: "SVTA 2053-1: Ad Creative Signaling in DASH and HLS, Revision 1.0"
    author:
      - org: Streaming Video Technology Alliance (SVTA), Advertising Working Group
    date: 2025-05-19
    target: https://www.svta.org/
    # TODO before submission: confirm the stable public URL for SVTA 2053-1 with the SVTA
    # Advertising WG. (This was a kramdown {::comment} block inside the YAML front matter,
    # which is not valid YAML and made the draft fail to build at all — the first compile
    # ever attempted, 2026-08-11, caught it.)

informative:
  # If this fails to resolve at build time, Will's draft is not on the datatracker yet.
  # His repo README links a name with different casing (scte35-MSF-event-timeline) than
  # his docname, which suggests it is still pre-submission. Fallback: expand this into a
  # full reference block with an explicit `target:` pointing at his GitHub Pages render
  # until the datatracker entry exists. Do NOT ship an unresolvable normative reference.
  SCTE35-MOQ: I-D.draft-wilaw-moq-scte35-event-timeline
  MOQT: I-D.ietf-moq-transport
  SCTE35:
    title: "Digital Program Insertion Cueing Message"
    author:
      - org: Society of Cable Telecommunications Engineers
    date: 2022
    seriesinfo:
      ANSI/SCTE: "35 2022"
  VAST:
    title: "Digital Video Ad Serving Template (VAST), Version 4.2"
    author:
      - org: IAB Technology Laboratory
    date: 2019-06
    target: https://iabtechlab.com/standards/vast/
  OMSDK:
    title: "Open Measurement SDK"
    author:
      - org: IAB Technology Laboratory
    date: false
    target: https://iabtechlab.com/standards/open-measurement-sdk/
  CAP-URLS:
    title: "Good Practices for Capability URLs"
    author:
      - ins: J. Tennison
        name: Jeni Tennison
    date: 2014-02
    target: https://www.w3.org/TR/capability-urls/
    seriesinfo:
      W3C: First Public Working Draft
  RFC7942:

--- abstract

This document defines the carriage of ad creative signaling -- creative
identity, tracking events, and measurement verification metadata as
specified by SVTA 2053-1 -- in records on a Media over QUIC (MOQT)
Streaming Format (MSF) Event Timeline track. It complements the carriage
of SCTE-35 splice signaling over the same mechanism: splice events
describe where placement opportunities occur on a media timeline, while
the event class defined here describes the creatives that fill them and
how their playback is to be measured. This binding is the MSF
counterpart of the DASH and HLS carriage bindings defined by SVTA
2053-1, which defines none for MOQT.

--- middle

{::comment}
Working copy lives at docs/proposals/draft-riedl-moq-ad-creative-signaling.md in the internal
repo; rename to draft-riedl-moq-ad-creative-signaling.md when moved into
its own i-d-template repository. Build: kdrfc <file>.md
House rules for this document: external vocabulary only -- "insertion
plan metadata", "distributor tracking endpoint / beacon proxy",
"capability URL". No internal system or product names.
{:/comment}

# Introduction {#introduction}

SCTE-35 messages {{SCTE35}} carried on an MSF Event Timeline track
{{SCTE35-MOQ}} give Media over QUIC deployments the function SCTE-35 was
built for: signaling placement opportunities -- break windows and splice
conditioning -- on a shared media timeline, using the Event Timeline
mechanism of the MOQT Streaming Format ({{Section 8.1 of MSF}}). What
that layer deliberately does not carry is a description of what plays
inside those windows.

On HLS and DASH, that gap is filled at the manifest: a packager or
stitcher decorates each session's playlist with creative identity and
tracking metadata. On a one-to-many publish/subscribe transport
{{MOQT}} there is no per-session manifest to decorate -- every
subscriber receives the same cached objects -- so anything a client
needs at render time (which creative is playing, which tracking
resources to request at which quartiles, which verification script to
load) must be delivered in band, on the shared timeline, ahead of the
splice point.

This need is not incidental. Accurate measurement of server-side ad
insertion increasingly means client-requested tracking -- per-device
accounting at render time rather than server-side firing at publish
time, which measures the wrong clock -- and verification means
initializing a measurement script {{OMSDK}} before the slot renders.
SVTA 2053-1 {{SVTA2053}} already standardizes exactly this payload: a
Pod/Slot/TrackingEvent/Verification data model (Section 4 of
{{SVTA2053}}), explicitly agnostic to client-side, server-side, and
server-guided insertion, with carriage bindings defined per stream
format -- DASH EventStream, HLS EXT-X-DATERANGE, HLS Interstitials --
and none for MOQT.

This document fills that gap using the structures {{MSF}} and
{{SCTE35-MOQ}} already put in place: it defines an Event Timeline event
class whose records carry SVTA 2053-1 Version 2 carriage envelopes,
specifies how those records are timed and correlated with splice
signaling, and gives operational guidance for tracking on one-to-many
delivery. It changes nothing in the SVTA 2053-1 data model; payload
normativity remains with {{SVTA2053}}, and this binding could
additionally be published as a carriage section in a future revision of
that specification.

{::comment} TODO: one sentence positioning vs. WG adoption status of
MSF at submission time. {:/comment}

# Conventions and Definitions {#conventions}

{::boilerplate bcp14-tagged}

This document uses the terms Track, Group, Object, Event Timeline, and
the index reference fields `t`, `l`, and `m` as defined in {{MSF}}, and
the terms Pod, Slot, Tracking Event, Verification, and carriage envelope
as defined in Sections 4 and 5 of {{SVTA2053}}.

Additionally:

Distributor:
: The party operating the publisher that emits the media and signaling
  tracks (typically the party performing ad insertion).

Placement opportunity:
: A window on the media timeline, typically signaled by SCTE-35, in
  which advertising content plays.

Splice signaling track:
: An Event Timeline track carrying SCTE-35 records per {{SCTE35-MOQ}}.

Capability URL:
: A URL whose knowledge alone grants the ability to perform a narrow
  action, used here as a short-lived, opaque reference to a
  distributor-operated tracking endpoint {{CAP-URLS}}.

# Track Properties {#track-properties}

An MSF track carrying ad creative signaling:

* MUST declare a packaging value of `"eventtimeline"`;

* MUST declare an `eventType` value of
  `"urn:svta:advertising-wg:ad-creative-signaling"`. This is the data
  scheme URI defined in Section 5 of {{SVTA2053}}, used unversioned: as
  in the DASH binding, the payload version is carried inside the
  payload itself ({{payload}});

* MUST declare a `depends` attribute naming the media track or tracks
  whose timeline its records index. When the track accompanies a splice
  signaling track, it SHOULD name the same media track(s) as that
  track.

Because `eventType` is uniform for a track, and because implementations
do not mix payload flavors within one Event Timeline track (see Section
4.3 of {{SCTE35-MOQ}} for the same rule applied to SCTE-35), ad
creative signaling is carried on a *sibling* Event Timeline track
alongside any splice signaling track, not interleaved within it.

# Record Format {#record-format}

## Structure {#record-structure}

Each record is a JSON object {{RFC8259}} following the Event Timeline
data format of {{Section 8.1 of MSF}}. A record MUST contain:

* exactly one index reference field -- `t` (wallclock), `l` (MOQT
  Location), or `m` (media time) -- selected per {{index-selection}};
  and

* a `data` field whose value is exactly one Version 2 carriage
  envelope as defined in {{payload}}.

## Index Reference Selection {#index-selection}

Records describing creatives spliced into the media timeline SHOULD use
the `m` (media time) index, expressed in the coordinate space of the
`depends` media track and sharing that track's timeline zero point. The
`t` (wallclock) index MAY be used where a placement opportunity is
defined in wallclock terms and no media time is available. The `l`
(MOQT Location) index MAY be used for records bound to a delivery
position rather than a media time.

When a splice signaling track accompanies this track, index selection
SHOULD follow the same selection and precedence rules that track
applies (Section 4.2 of {{SCTE35-MOQ}}), so that co-timed records on
the two tracks carry comparable index values ({{correlation}}).

{::comment} TODO: decide whether to restate the full wilaw 4.2
precedence rules normatively here (self-contained) or keep this
alignment-by-reference. Restating is safer while SCTE35-MOQ is
informative. {:/comment}

## Payload: Version 2 Carriage Envelope {#payload}

The `data` field carries one SVTA 2053-1 Version 2 carriage envelope
(Section 5.2.2.1 of {{SVTA2053}}) directly:

~~~ json
{ "version": 2, "type": "...", "payload": [ ... ],
  "features": { ... } }
~~~

The envelope is self-describing -- version and payload type are fields
-- so no additional wrapper member is defined.

Unlike the DASH and HLS bindings, where bare Version 1 payload objects
are also legal, records in this binding MUST carry Version 2 envelopes
only. On a fan-out transport the envelope's `features` flags are the
only capability-signaling mechanism available, and the envelope `type`
field is what allows a uniform track to carry `pod`, `slot`, and
`trackingEvent` payloads interchangeably.

It is RECOMMENDED that a publisher emit one `pod` envelope per
placement opportunity. `slot` and `trackingEvent` envelopes MAY be used
(mirroring the granularity options of the DASH binding), but
deduplication under redelivery is simplest at pod granularity (see
{{open-issues}}).

# Timing and Correlation {#timing}

## Shared Index Space {#index-space}

A creative signaling record's index values are interpreted in the same
coordinate space, with the same timeline zero point, as the `depends`
media track -- and therefore the same space as an accompanying splice
signaling track that names the same media track.

## Correlation with Splice Signaling {#correlation}

The record or records describing a placement opportunity SHOULD carry
the same index value as the SCTE-35 record whose splice point opens
that opportunity (the same `m`, or the same `l` Location when the
splice is immediate). A pod whose start differs from the splice point
MUST carry an index within the window the splice defines.

## Publication Lead {#publication-lead}

The publisher SHOULD publish a placement opportunity's creative
signaling record(s) at least one full Group ahead of the media Group
containing the splice point. Clients render seconds behind delivery,
while render-time tracking and verification fire windows are
sub-second: the tracking table must already be resident on the device
when the first ad frame displays, with no time for a lookup round
trip.

{::comment} Note for WG discussion: SCTE35-MOQ states no
advance-delivery rule for splice records either; a shared SHOULD would
benefit both event classes. {:/comment}

## Container-Relative Interior Timing {#interior-timing}

Within the envelope, timing is container-relative, per Sections 4.4.2
and 4.4.5 of {{SVTA2053}}: a Slot's `start` is relative to its Pod, and
a Tracking Event's `offset` is relative to its container. Only the
record's index reference is absolute. Consequently, redelivery, looped
schedules, and regional timeline shifts never require payload rewrites
-- which matters where relays cache and re-serve objects.

# Worked Example {#example}

An SCTE-35 record on the splice signaling track (reproduced from
Section 5.1 of {{SCTE35-MOQ}}) announces a splice at media time
480500 ms:

~~~ json
{
  "m": 480500,
  "data": {
    "scte35_payload":
      "/DAhAAAAAAAAAP/wFAUAAArXf+/+AAAAAH4AARSyAAAAAA=="
  }
}
~~~

The companion record on the ad creative signaling track, published at
least one Group earlier ({{publication-lead}}), carries the same index.
It describes a 45.045-second pod with two slots: explicit quartile
tracking and a verification resource on slot 1 (no `offset` on the
quartile events, so timing is driven by event-type semantics per
Section 4.4.5 of {{SVTA2053}}), and lazily resolved tracking on slot 2
via `$remote` ({{capability-urls}}):

~~~ json
{
  "m": 480500,
  "data": {
    "version": 2,
    "type": "pod",
    "payload": [{
      "duration": 45.045,
      "slots": [
        {
          "type": "linear",
          "start": 0.0,
          "duration": 30.03,
          "identifiers": [{
            "scheme":
      "urn:smpte:ul:060E2B34.01040101.01200900.00000000",
            "value": "ABCD1234567H"
          }],
          "tracking": [
            { "type": "impression", "urls": [
              "https://beacons.example.net/c/7f3a92/imp"
            ] },
            { "type": "firstQuartile", "urls": [
              "https://beacons.example.net/c/7f3a92/q1"
            ] },
            { "type": "midpoint", "urls": [
              "https://beacons.example.net/c/7f3a92/q2"
            ] },
            { "type": "thirdQuartile", "urls": [
              "https://beacons.example.net/c/7f3a92/q3"
            ] },
            { "type": "complete", "urls": [
              "https://beacons.example.net/c/7f3a92/done"
            ] }
          ],
          "verifications": [{
            "vendor": "vendor.example-omid",
            "parameters": "key=value",
            "resource":
              "https://cdn.vendor.example/omid-verify.js"
          }]
        },
        {
          "type": "linear",
          "start": 30.03,
          "duration": 15.015,
          "identifiers": [{
            "scheme": "urn:com:example:ads:id",
            "value":
              "972c79e1-2363-403e-9287-a0fa4323c389"
          }],
          "$remote": {
            "tracking":
              "https://beacons.example.net/c/9d41c7/trk"
          }
        }
      ],
      "tracking": [
        { "type": "podStart", "urls": [
          "https://beacons.example.net/c/p8842/start"
        ] },
        { "type": "podEnd", "urls": [
          "https://beacons.example.net/c/p8842/end"
        ] }
      ]
    }],
    "features": { "remoteFields": true }
  }
}
~~~

# Tracking Indirection and Capability URLs {#capability-urls}

Section 5.2.2.2 of {{SVTA2053}} already says interpreters SHOULD defer
`$remote` resolution until the containing object is about to become
active. That deferral maps naturally onto broadcast fan-out, with one
addition: on a shared timeline, the URLs in tracking and `$remote`
fields SHOULD be short-lived capability URLs {{CAP-URLS}} referencing a
distributor-operated tracking endpoint (a "beacon proxy"), rather than
raw measurement-vendor URLs.

At activation, the client requests the capability URL (or resolves
`$remote` from it), appending a client identifier ({{client-identity}}).
The endpoint performs macro substitution per Section 6 of {{VAST}} (as
Section 5.2.3 of {{SVTA2053}} provides) and requests the corresponding
vendor resources with the calling device's context. Two properties fall
out for free on one-to-many delivery:

* **Payload size**: shared-timeline records stay small even for heavy
  vendor tracking lists, with late binding after the pod record ships.

* **Privacy and cache-safety**: no per-user macro values and no vendor
  endpoint inventory appear in bytes that every subscriber and relay
  cache can read.

## Client Identity and Per-Device Accounting {#client-identity}

Because every subscriber receives identical records, per-device
measurement requires the device to identify itself at request time, not
in the payload. A client SHOULD append a pseudonymous, session-scoped
client identifier (issued and signed out of band, for example with the
playback session) as a query parameter when requesting capability URLs.
The tracking endpoint can then deduplicate on (resource, event, client
identifier), count unique reach, and forward at most one request per
device per event to vendor resources with that device's context --
preserving per-device measurement semantics without per-device
payloads. Raw device identifiers MUST NOT appear in requested URLs.

## Load Shaping {#load-shaping}

On a shared fixed timeline, every subscriber reaches the same tracking
instant at the same wallclock moment; naive activation-time behavior
synchronizes both the `$remote` resolution fetches and the tracking
requests of the entire audience. Clients SHOULD resolve `$remote`
fields within a randomized window ahead of activation (the publication
lead of {{publication-lead}} provides the margin), and SHOULD apply
bounded random jitter to tracking requests whose measurement semantics
tolerate it, carrying the original event time as data where the
measurement moment must be preserved. Verification-critical requests
with sub-second fire windows are the exception and are expected to be
provisioned for.

# Per-Session Insertion Plans {#insertion-plans}

Everything above is deliberately identical bytes for every subscriber
-- that is what makes it relay-cacheable. Server-guided insertion,
per-session capability URLs, and entitlement-scoped fields are
per-session by definition and cannot ride the shared timeline. The
authors believe the standardization target for that layer is a separate
per-session insertion plan mechanism: a unicast-scoped metadata track
(or equivalent side channel) carrying distributor session metadata --
the session's pod assignment for each shared-timeline placement
opportunity, its capability URLs, and policy fields -- which composes
with the shared events defined here (the shared timeline announces
placement geometry and the broadcast/default pod; the insertion plan
overlays the per-session decision).

That mechanism is out of scope for this document and deserves its own.
It is named here only as a design constraint: the event class defined
in this document is intended to be overridden or parameterized by such
a layer without being redefined by it.

# Open Issues {#open-issues}

This section lists issues to be resolved through working group
discussion; it is to be removed before publication.

1. **Granularity**: one `pod` envelope per placement opportunity (the
   RECOMMENDED default), or `slot`/`trackingEvent` envelopes per
   creative? Redelivery deduplication is simpler at pod granularity.

2. **Update semantics for live**: pods change close to air. Is a later
   record at the same index a full supersede (last-writer-wins), or is
   a patch rule needed? {{SVTA2053}} has no cancel/supersede concept;
   SCTE-35 inherits cancellation from its payload semantics.

3. **Deduplication and late joiners**: the DASH/HLS bindings give each
   event a manifest-unique id for dedup on re-encounter; MSF records
   carry no id. Is (eventType, index, payload) a sufficient dedup key
   under relay redelivery and FETCH catch-up -- and which past records
   MUST a mid-break joiner fetch?

4. **Switching sets**: when ladder rungs are separate tracks, does one
   creative signaling track `depends` on all of them? Splice
   conditioning can land at slightly different media times per rung;
   container-relative interior offsets survive that, but a single `m`
   may not. Sender-side track switching under discussion in the MOQ
   Working Group sharpens this: if relays select the delivered rung per
   subscriber and switch at Group boundaries, (a) these records must
   remain valid for every rung of a switching set, (b) splice
   conditioning must keep switching sets coherent at placement
   boundaries, and (c) the delivered rendition is known only at the
   client, so rendition-level measurement is necessarily
   client-observed.

5. **Common-format scope**: is the Event Timeline binding the whole
   story, or is a container-level mapping (the envelope in CMAF `emsg`)
   also wanted so one payload survives packager transit across
   HLS/DASH/MOQT boundaries?

6. **Feature negotiation on one-to-many**: {{SVTA2053}} interpreters
   SHOULD error on unsupported flagged features -- sensible unicast
   behavior, but a broadcast publisher cannot negotiate per subscriber.
   Should the catalog advertise which features a track uses so clients
   subscribe eyes-open?

7. **Record integrity**: do these records need payload signing (JWS or
   COSE over the envelope, or a catalog-pinned key) beyond transport
   authentication? See {{security}}.

# Implementation Status {#impl-status}

(This section follows {{RFC7942}} and is to be removed before
publication as an RFC.)

The author operates a working server-side ad insertion deployment over
MOQT: fixed-timeline linear channels with a stitcher publishing
SCTE-35-conditioned placement opportunities alongside creative and
tracking metadata on companion tracks, with client-requested tracking
resolved through a distributor tracking endpoint of the kind described
in {{capability-urls}}. The timing rules in {{timing}} derive from that
running code rather than from speculation.

{::comment} TODO after 2026-10-11: add results from the October MoQ
interop event (moqt draft-19) -- publisher/relay pairings exercised,
and any third-party clients that consumed the event track. Offer: JSON
schemas, test vectors, and a live publisher endpoint. {:/comment}

# Security Considerations {#security}

## Integrity of Tracking Records {#integrity}

Tracking URLs move money. A relay path is not end-to-end confidential
or authentic by default, and a tampered creative signaling record turns
a large synchronized audience into a request cannon aimed at an
arbitrary URL -- amplifying the denial-of-service concerns already
noted for splice records (Section 6.3 of {{SCTE35-MOQ}}) with an
attacker-chosen target. Deployments MUST authenticate the publication
path for this track, and receivers SHOULD restrict tracking requests to
URL authorities the distributor has designated (capability URLs at a
distributor endpoint make this restriction natural). Whether records
additionally need payload signing is tracked in {{open-issues}}.

## Amplification and Load {#amplification}

Even absent an attacker, activation-synchronized behavior across a
broadcast audience is a self-inflicted denial of service; the
mitigations in {{load-shaping}} are accordingly stated as client
SHOULDs. Capability URLs bound the blast radius of both cases: devices
address the distributor's endpoint, which applies its own policy before
any vendor is contacted.

## Payload Validation {#validation}

Receivers MUST treat record payloads as untrusted input: enforce size
and nesting limits on the JSON envelope, and accept only `https` URLs
in tracking, `$remote`, and verification fields. Verification resources
are executable code; clients MUST apply their platform's script-loading
policy and SHOULD load them only for slots that will actually render.

## Privacy {#privacy}

By construction, the shared timeline carries no per-user data: records
are identical for every subscriber, per-device identity is appended by
the client at request time ({{client-identity}}), and identifiers are
pseudonymous and session-scoped. Indirection through capability URLs
additionally keeps vendor endpoint inventories and macro-expanded
values out of relay caches. Distributor tracking endpoints handle real
device context (addresses, user agents) and MUST apply applicable
consent and data-protection policy before forwarding it to vendors.

# IANA Considerations {#iana}

This document requests registration of the following entry in the "MSF
Event Timeline Types" registry established by {{Section 14.2 of MSF}}.
{{SCTE35-MOQ}} registers entries in that same registry; this document
follows the same pattern.

| Event Type | Description | Reference |
|---|---|---|
| urn:svta:advertising-wg:ad-creative-signaling | SVTA 2053-1 ad creative signaling, Version 2 carriage envelope | This document; {{SVTA2053}} |
{: title="Addition to the MSF Event Timeline Types registry"}

Editor's note (to be resolved before publication): the URN is defined and
owned by the SVTA Advertising Working Group; this registration is made in
coordination with that group.

--- back

# Acknowledgments {#acknowledgments}
{:numbered="false"}

This document deliberately reuses the carriage pattern established by
Will Law and Suhas Nandakumar in {{SCTE35-MOQ}}, and is designed to
compose with it. The payload data model is the work of the SVTA
Advertising Working Group {{SVTA2053}}.

{::comment} TODO: add October interop participants and early reviewers
before submission. {:/comment}

# JSON Schema and Test Vectors {#schema}
{:numbered="false"}

{::comment} TODO: appendix placeholder -- publish the JSON Schema for
the record shape (envelope constraint profile) and a set of test
vectors (filled pod, pod with $remote, empty/unfilled opportunity,
back-to-back opportunities) from the reference implementation. {:/comment}

(To be provided in a future revision.)
