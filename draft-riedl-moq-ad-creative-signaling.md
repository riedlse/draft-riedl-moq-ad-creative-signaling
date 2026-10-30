---
title: "Ad Creative Signaling over the MSF Event Timeline"
abbrev: "MSF Ad Creative Signaling"
docname: draft-riedl-moq-ad-creative-signaling-latest
# The revision number lives in the Makefile (SUB_REV), which substitutes it for
# "-latest" when building the submission file: `make submission`.
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
  latest: "https://riedlse.github.io/draft-riedl-moq-ad-creative-signaling/draft-riedl-moq-ad-creative-signaling.html"

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
    # Verified on svta.org 2026-10-30. Product page: "SVTA2053-1: Ad Creative Signaling in DASH
    # and HLS Revision 1.0", Advertising Working Group, published 2025-05-19, 41 pages; its
    # predecessor is SVTA2053 Version 1.1 (2023-06-19). SVTA's project page calls SVTA2053-1 the
    # second edition ("Version 2.0" project); its data model is what the body calls the Version 2
    # carriage envelope (Section 5.2). The SVTA number and revision ride in seriesinfo so the
    # title stays the document's own. The product URL is slug-stable (it is the document number)
    # and replaces the SVTA root used in -00. Cite only published SVTA editions.
    title: "Ad Creative Signaling in DASH and HLS"
    author:
      - org: Streaming Video Technology Alliance (SVTA), Advertising Working Group
    date: 2025-05-19
    seriesinfo:
      SVTA: "2053-1, Revision 1.0"
    target: https://www.svta.org/product/svta2053-1/
    ann: "This document uses the Version 2 data carriage scheme and object model (Sections 4 and 5.2)."

informative:
  # INFORMATIVE, deliberately (Steven, 2026-08-11). Ad-creative signaling is independent of
  # ad-LOCATION signaling: a client can detect a break from embedded ID3, an emsg, or the
  # creative records' own timing, with no SCTE-35 track present at all. Every reference to this
  # draft in the body is conditional ("when a splice signaling track accompanies this track")
  # or an explicit analogy -- there is no MUST that requires reading it, so it is not normative.
  # Practical upside: no MISSREF, so this document's publication is not gated on an individual
  # draft advancing.
  SCTE35-MOQ: I-D.draft-wilaw-moq-scte35-event-timeline
  MOQT: I-D.ietf-moq-transport
  VECTORS:
    title: "draft-riedl-moq-ad-creative-signaling source repository: schema/ and vectors/"
    author:
      - ins: S. Riedl
        name: Steven Riedl
    date: false
    target: https://github.com/riedlse/draft-riedl-moq-ad-creative-signaling
  SVTA2053-2:
    # Title as on the SVTA project page, verified 2026-10-30; no document is published yet.
    title: "Non-Linear (Concurrent) Ad and Media Experiences: SVTA2053-2 Ad Creative Signaling in DASH and HLS, 3rd Edition, with Reference Implementations"
    author:
      - org: Streaming Video Technology Alliance (SVTA)
    date: false
    target: https://www.svta.org/project/non-linear-concurrent-ad-and-media-experiences-svta2053-2-ad-creative-signaling-in-dash-and-hls-3rd-edition-with-reference-implementations/
    ann: "Work in progress; publication planned by January 2027."
  MOQT-SUBGROUP-PROPS:
    title: "Add Subgroup Properties"
    author:
      - name: Michal Hošna
        asciiFullname: Michal Hosna
    date: 2026-10
    target: https://github.com/moq-wg/moq-transport/pull/2023
    seriesinfo:
      "moq-transport": "Pull Request 2023"
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
Build: `make` (editor's copy, -latest) or `make submission` (the numbered
submission file; revision in the Makefile's SUB_REV).
House rules for this document: external vocabulary only -- "insertion
plan metadata", "distributor tracking endpoint / beacon proxy",
"capability URL". No internal system or product names, and no captured
identifiers, hostnames or tracking URLs: examples and vectors are
anonymized to example.com / example.net placeholders.
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

On status: {{MSF}} is an adopted work item of the MoQ Working Group,
and its Event Timeline mechanism is the substrate here; this document
and {{SCTE35-MOQ}} are individual submissions layered on that substrate,
and this one is written to track {{MSF}} as it evolves under WG change
control -- including following its registry, wherever that registry
ultimately lands. The event class is deployed: a continuously running
server-side ad insertion deployment publishes it, and {{impl-status}}
reports what was measured.

# Conventions and Definitions {#conventions}

{::boilerplate bcp14-tagged}

This document uses the terms Track, Group, Object, Event Timeline, and
the index reference fields `t`, `l`, and `m` as defined in {{MSF}}, and
the terms Pod, Slot, Tracking Event, Verification, and carriage envelope
as defined in Sections 4 and 5 of {{SVTA2053}}.

The index keys are spelled as in the published {{MSF}}. The MSF
editor's copy has since renamed them `T`, `L` and `M`; this document
will follow whichever spelling MSF settles on, and implementations may
wish to accept both in the meantime.

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

* MUST declare a packaging value of `"eventtimeline"` and a `mimeType`
  of `"application/json"`, as {{Section 8.2 of MSF}} requires of every
  Event Timeline track;

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

A splice signaling track is not required. Ad creative signaling describes
what plays inside a placement opportunity; it does not depend on how the
boundaries of that opportunity were signaled. A deployment MAY carry ad
creative signaling with no SCTE-35 records present, leaving break
detection to another mechanism entirely -- in-band timed metadata such as
ID3, an `emsg` box, or the timing carried by the creative records
themselves. Where a splice signaling track *is* present, the alignment
rules in {{correlation}} let the two be correlated; where it is absent,
those rules simply do not apply.

# Record Format {#record-format}

## Structure {#record-structure}

Each record is a JSON object {{RFC8259}} following the Event Timeline
data format of {{Section 8.1 of MSF}}. A record MUST contain:

* exactly one index reference field -- `t` (wallclock), `l` (MOQT
  Location), or `m` (media time) -- selected per {{index-selection}}
  and typed as {{Section 8.1 of MSF}} defines it: `t` and `m` are JSON
  Numbers of milliseconds (a wallclock index is milliseconds since the
  Unix epoch, not a date string), and `l` is an Array of two Numbers,
  the MOQT Group ID and Object ID; and

* a `data` field whose value is exactly one Version 2 carriage
  envelope as defined in {{payload}}.

Records are carried in the Objects of the track as {{Section 8.3 of MSF}}
specifies: the first Object of each Group is the independent array of
every record accumulated and accessible so far. A subscriber that joins
at a Group boundary during a placement opportunity therefore receives
its record, provided the publisher keeps the record accessible until the
opportunity has ended.

## Index Reference Selection {#index-selection}

Records describing creatives spliced into the media timeline SHOULD use
the `m` (media time) index, expressed in the coordinate space of the
`depends` media track and sharing that track's timeline zero point. The
`t` (wallclock) index MAY be used where a placement opportunity is
defined in wallclock terms and no media time is available. The `l`
(MOQT Location) index MAY be used for records bound to a delivery
position rather than a media time.

When a splice signaling track accompanies this track, records on the two
tracks that describe the same point on the media timeline SHOULD carry
index values of the same kind, chosen by the same precedence, so that a
consumer can correlate them without converting between index types
({{correlation}}). The requirement is on the observable result --
comparable indices for co-timed records -- not on adopting any particular
document's selection algorithm. A deployment carrying SCTE-35 records per
{{SCTE35-MOQ}} satisfies it by applying that specification's index
selection rules (its Section 4.2) to both tracks.

## Payload: Version 2 Carriage Envelope {#payload}

The `data` field carries one SVTA 2053-1 Version 2 carriage envelope
(Section 5.2.2.1 of {{SVTA2053}}) directly:

~~~
{ "version": 2, "type": "...", "payload": [ ... ],
  "features": { ... } }
~~~

The envelope is self-describing -- version and payload type are fields
-- so no additional wrapper member is defined.

Unlike the DASH and HLS bindings, where bare Version 1 payload objects
are also legal, records in this binding MUST carry Version 2 envelopes
only. On a fan-out transport the envelope's `features` flags are the
only capability-signaling mechanism available, and the envelope `type`
field is what allows a uniform track to carry `pod`, `slot`,
`trackingEvent`, and `verification` payloads interchangeably -- the four
types Section 5.2.2.1 of {{SVTA2053}} defines.

The envelope and its payload objects use the member names and units of
{{SVTA2053}} unchanged. In particular, every timing member inside the
envelope (`start`, `duration`, `offset`, `skipOffset`) is a MediaTime: a
number of seconds (Section 4.2.1 of {{SVTA2053}}), not milliseconds.
Only the record's index reference is in milliseconds, because {{MSF}}
defines it so.

A publisher MUST NOT set to `true` any `features` flag that {{SVTA2053}}
does not define. Under Section 5.2.2.1 of {{SVTA2053}}, an interpreter
that meets a flag set to `true` that it does not support raises an
error and ignores the payload, so an undefined flag makes every
conforming interpreter discard the record. The only flag defined today is
`remoteFields`, which {{SVTA2053}} requires to be `true` when the payload
uses `$remote` ({{capability-urls}}); a payload that does not use
`$remote` can omit `features` entirely.

Two inconsistencies in {{SVTA2053}} matter to parsers. Its TrackingEvent
payload table (Table 11) lists `start` and `duration` where its object
model (Section 4.4.5) defines `offset`, and its Remote Fields table
(Table 16) says a `$remote.verifications` URI resolves to an envelope of
type `verifications` where the envelope (Table 15) defines
`verification`. This document follows the object model and the envelope
definition: TrackingEvent timing is `offset`, and the envelope type is
`verification`.

It is RECOMMENDED that a publisher emit one `pod` envelope per
placement opportunity. The `slot`, `trackingEvent`, and `verification`
envelopes MAY be used (mirroring the granularity options of the DASH
binding), but deduplication under redelivery is simplest at pod
granularity, and a decomposed record loses the structural link to the
slot it belongs to (see {{open-issues}}).

## Subscriber Invariance {#invariance}

Records on this track MUST be subscriber-invariant: no field value may
vary between subscribers. Per-session values enter only after delivery,
either by client-side macro substitution (Section 6 of {{VAST}}) against
broadcast templates, or by request-time indirection through capability
URLs ({{capability-urls}}). A macro template is conformant precisely
because the template is identical for every subscriber; substitution is
a post-delivery operation.

The DASH and HLS bindings of {{SVTA2053}} assume a per-session manifest,
so payload fields carrying session-scoped tracking values are
well-formed in those bindings. That assumption does not hold here:
records on a shared Event Timeline track are delivered identically to
every subscriber and are relay-cacheable, so a session-scoped field
would both leak across sessions and defeat caching.

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

When an envelope carries Slot or TrackingEvent objects without their
Pod (a `slot` or `trackingEvent` envelope), the record's index stands in
for the missing container: a Slot's `start` and a Tracking Event's
`offset` are relative to the record's index. A standalone Slot therefore
normally has `start` 0, as the per-slot events of the DASH binding do
(Section 6.1.2 of {{SVTA2053}}).

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

The `remoteFields` flag is set because slot 2 uses `$remote`. This
record is also published as the `worked-example` test vector. The
appendix on test vectors ({{schema}}) shows a record captured from the
running deployment.

# Tracking Indirection and Capability URLs {#capability-urls}

Two patterns satisfy {{invariance}}. In the first, the record carries
broadcast tracking templates and the client performs macro substitution
locally at activation; SVTA 2053-1 payloads carry over from the DASH and
HLS bindings unchanged and no distributor infrastructure is required, at
the cost of exposing vendor endpoint inventory in shared bytes,
inflating every record by the full tracking list, and leaving per-device
accounting to the macros alone. The second, described in the remainder
of this section, defers resolution to a distributor-operated endpoint.
Both are conformant; a publisher chooses per deployment.

Section 5.2.2.2.2 of {{SVTA2053}} already says interpreters SHOULD defer
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
This mechanism applies to the indirection pattern; under client-side
substitution, per-device accounting rests on the macro values alone.
The tracking endpoint can then deduplicate on (resource, event, client
identifier), count unique reach, and forward at most one request per
device per event to vendor resources with that device's context --
preserving per-device measurement semantics without per-device
payloads. Raw device identifiers MUST NOT appear in requested URLs.

## Load Shaping {#load-shaping}

On a shared fixed timeline, every subscriber reaches the same tracking
instant at the same wallclock moment; naive activation-time behavior
synchronizes both the `$remote` resolution fetches and the tracking
requests of the entire audience. This applies with particular force
under client-side substitution, where no distributor endpoint sits in
the path to absorb the burst. Clients SHOULD resolve `$remote`
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

Between those two extremes there is a third scope worth naming,
because the choice is not binary. Records can be published per
**cohort**: one track per distinct ad decision, shared by every device
that resolves to it. Per-device plans are by definition uncacheable --
one subscriber per track -- which forfeits the fan-out that motivates
one-to-many delivery in the first place and reduces to per-session
manifest stitching with extra steps. Cohort scope keeps relay fan-out
within each cohort and bounds the number of distinct tracks by the
number of decisions rather than the number of viewers. Server-guided
insertion can therefore be served at whichever of the three scopes the
deployment's decisioning actually requires.

The event class defined here is unchanged across all three: shared,
per-cohort, and per-session differ in the scope of the track carrying
the records, not in the records themselves. That is deliberate --
scope is a deployment decision, and this binding should not have to be
redefined to follow it.

That per-session mechanism is out of scope for this document and
deserves its own. It is named here only as a design constraint: the
event class defined in this document is intended to be overridden or
parameterized by such a layer without being redefined by it.

# Track Split and Future Carriage {#future-carriage}

This section is informative; nothing in it changes the requirements
above.

Ad signaling is expected to grow by function rather than by record
size. Interactivity, click-through handling, and third-party
verification are each better carried on their own sibling Event
Timeline track, with its own `eventType`, the same `depends` media
track and the same index space, than as further members of the records
defined here. A client then subscribes only to the functions it
implements, which settles much of the feature-negotiation question for
whole functions (item 6 of {{open-issues}}), and each function's
records keep their own size, cadence and failure behavior. The cost is
the missing placement identifier (item 8 of {{open-issues}}): once
records describing one placement opportunity are spread across tracks,
a shared index identifies the opportunity but not the slot within it.

Separately, {{MOQT}} today defines properties at Track and Object scope
only. A proposal before the MoQ Working Group {{MOQT-SUBGROUP-PROPS}}
would carry properties in the subgroup header, where they travel with
every stream that carries the subgroup, including FETCH responses,
instead of riding a first Object that a mid-Group joiner, a filter or a
FETCH range can miss. If it is adopted, break-level state -- an
opportunity identifier, the remaining break duration, the Group at
which content resumes -- could be carried in the subgroup headers of the
media track itself. That would complement the records defined here
rather than replace them: subgroup properties describe the break at the
delivery position as it is delivered, while the Event Timeline describes
the creatives ahead of the splice.

The data model itself is also growing. SVTA is preparing a 3rd edition,
{{SVTA2053-2}}, for non-linear (concurrent) ad and editorial
presentations such as overlays, squeezebacks and L-shapes. It is
specified as an additive extension of the Version 2 carriage envelope
(a Viewport data type, a PresentationType enumeration and layout
control) and defines carriage for DASH and HLS. This document carries
the Version 2 envelope without interpreting the payload objects
({{schema}}), so payloads using those extensions would ride unchanged on
an ad creative signaling track. Carriage over the MSF Event Timeline, as
defined here, is a candidate for a later SVTA2053 edition.

# Open Issues {#open-issues}

This section lists issues to be resolved through working group
discussion; it is to be removed before publication.

1. **Granularity**: one `pod` envelope per placement opportunity (the
   RECOMMENDED default), or `slot`, `trackingEvent` and `verification`
   envelopes per creative? Redelivery deduplication is simpler at pod
   granularity. The deployment described in {{impl-status}} publishes
   `pod` envelopes only and has not needed anything finer.

2. **Update semantics for live**: pods change close to air. Is a later
   record at the same index a full supersede (last-writer-wins), or is
   a patch rule needed? {{SVTA2053}} has no cancel/supersede concept;
   SCTE-35 inherits cancellation from its payload semantics.
   Implementation experience favors the simple rule. When a splice
   fails, the deployed publisher publishes a complete new record with
   the same `m`, dropping the failed slot and moving the later ones to
   where they really air, and its player replaces only the events it has
   not yet fired. No patch rule has been needed so far.

3. **Deduplication and late joiners**: the DASH/HLS bindings give each
   event a manifest-unique id for dedup on re-encounter; MSF records
   carry no id. Is (eventType, index, payload) a sufficient dedup key
   under relay redelivery and FETCH catch-up -- and which past records
   MUST a mid-break joiner fetch? Experience so far: with one `pod`
   record per opportunity, `m` alone has served as the record key (a
   changed payload at a known `m` is a supersede), and the player fires
   each event at most once per (`m`, slot, event type). For late joiners
   the deployed publisher keeps each record in every independent Object
   until 60 s after its pod ends, and re-sends the retained array as a
   new Group about every 3 s when nothing has changed, so a subscriber
   that starts at the next Group rather than the latest one holds the
   timeline within seconds. Whether that re-send deserves a SHOULD is
   open.

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

   That mechanism now has a concrete shape to test against. The
   `SWITCH_FROM` proposal distinguishes an *aligned* switch, where Group
   IDs from the two tracks are compared, from an *unaligned* switch,
   where they are not. The distinction decides this issue directly: a
   single `m` on one signaling track can only address a switching set if
   switches are aligned, since an unaligned switch leaves no common
   Group-ID frame in which one index means the same instant on every
   rung. Under unaligned switching the interior offsets survive but `m`
   does not, which would push the binding toward either a per-rung
   signaling track or an index defined against something other than the
   media track's Group IDs. The proposal was not resolved at the
   2026-09-08 interim and remains open as of this revision; at least
   one implementation (MOQtail) reports partial draft-18 support, so
   experience should be available before this document has to choose.

5. **Common-format scope**: is the Event Timeline binding the whole
   story, or is a container-level mapping (the envelope in CMAF `emsg`)
   also wanted so one payload survives packager transit across
   HLS/DASH/MOQT boundaries?

6. **Feature negotiation on one-to-many**: {{SVTA2053}} interpreters
   SHOULD error on unsupported flagged features -- sensible unicast
   behavior, but a broadcast publisher cannot negotiate per subscriber.
   Should the catalog advertise which features a track uses so clients
   subscribe eyes-open? The `features` member this rests on is
   confirmed: the Version 2 base carriage envelope defines it as an
   object of boolean flags, with `features.remoteFields` as the only
   flag so far, and requires that an interpreter encountering a flag it
   does not support SHOULD raise an error and ignore the payload. This
   revision settles the easy half by forbidding flags that {{SVTA2053}}
   does not define ({{payload}}); the hard half -- a defined flag that
   some subscribers do not support -- remains. That rule is written for
   unicast, where the publisher learns of the failure; on one-to-many
   the publisher never hears, so the burden has to move to subscribe
   time. Note also that if the per-function tracks of a split
   ({{future-carriage}}) are published as separate broadcasts rather
   than sibling tracks, a subscriber selects the functions it supports
   by subscribing to them, which answers much of this for the split case
   but not for flagged features within a single track.

7. **Record integrity**: do these records need payload signing (JWS or
   COSE over the envelope, or a catalog-pinned key) beyond transport
   authentication? See {{security}}.

8. **No stable placement identifier**: {{SVTA2053}} gives neither the Pod
   nor the Slot object an identifier. A Pod carries `start`, `duration`,
   `slots` and `tracking`; a Slot carries `type`, `start`, `duration`,
   `media`, `identifiers`, `tracking`, `verifications`, `skipOffset` and
   `clickThrough`. `MediaReference` does have an `id`, but the
   specification states that uniqueness of that value "is desired, but
   not required", so it cannot be relied on as a key. The Slot
   `identifiers` array identifies the **creative**, not the
   **placement**: the same creative may legitimately appear twice in one
   pod, and each appearance is measured separately.

   While an envelope carries a whole pod, correlation is structural and
   the absence costs nothing. It only bites once records are decomposed
   -- which {{SVTA2053}} itself already does in two places, the `$remote`
   fields that resolve `slots`, `tracking` and `verifications`
   separately, and the HLS Interstitial ASSET-LIST mapping, whose own
   note observes that it "separates the Slot objects from the Pod
   objects without explicit reference". This document decomposes further
   still if the event class is split by function across sibling tracks
   ({{future-carriage}}), because then a tracking or verification record
   and the creative record it belongs to arrive on different tracks: a
   shared index identifies the placement opportunity, not which slot
   within it.

   Three ways out. Derive a composite key from what already exists --
   creative `identifiers` plus the slot's ordinal position within the
   pod, anchored by the shared index -- which needs no change to
   {{SVTA2053}} but is positional and therefore fragile under pod
   rewriting. Or request stable `id` fields on Pod and Slot from the
   SVTA Advertising Working Group, which is the clean fix and the one
   their ASSET-LIST note already argues for. Or define identifiers in
   this document, which is the wrong layer: payload normativity belongs
   with {{SVTA2053}} and this binding should not fork the data model.
   The first is what an implementation can do today; the second is what
   the ecosystem should have.

   The deployed player ({{impl-status}}) takes the first way, with an
   occurrence count in place of the raw ordinal: a slot's key is its
   `identifiers` plus the number of earlier slots in the same pod that
   carry the same identifiers. That keeps a superseding record that
   drops a slot from shifting the other slots' firing history. It would
   still mis-key two appearances of one creative if a rewrite reordered
   them.

# Implementation Status {#impl-status}

(This section follows {{RFC7942}} and is to be removed before
publication as an RFC.)

The author operates a continuously running server-side ad insertion
deployment over MoQ: fixed-timeline linear channels, publisher to relay
to browser, with ad creatives spliced server-side into one shared
broadcast, so every subscriber receives the same media objects -- the
condition that motivates this document ({{introduction}}). The
publisher and player are not publicly available. Since 2026-10-22 the deployment publishes the event class
this document defines. This section reports what it does, what was
measured, and what is not yet implemented. Contact: the author.

Publisher, live on both of the deployment's ad-inserted channels since
2026-10-22:

* Each channel's broadcast carries a sibling Event Timeline track named
  `ad-creative`, beside the deployment's earlier proprietary control
  track, which is still published in parallel.
* Each placement opportunity is one record,
  `{"m": ..., "data": {"version": 2, "type": "pod", "payload": [...]}}`,
  where `m` is the media time, in milliseconds on the timeline of the
  media track, of the pod's first video frame. Envelopes carry no
  `features` member. Slot identifiers use a proprietary identifier
  scheme; tracking URLs are capability URLs ({{capability-urls}}).
* Objects follow {{Section 8.3 of MSF}}: each change starts a new Group
  whose single Object is the independent array of every retained
  record, with no incremental Objects. The first Group ID is taken from
  the wallclock in milliseconds, per the restart rule of
  {{Section 6.1 of MSF}}, and that first Object is the empty array.
* A read-only validator subscribes to the track and checks every
  Object: a JSON array of records, each with exactly one index field
  and a Version 2 envelope whose payload has the {{SVTA2053}} shape
  (member names and types, MediaTime values in seconds, identifiers,
  non-empty `urls`, defined event types, no undefined feature flag). It
  runs against the deployment's channels.

Added on 2026-10-25:

* Measured slots: each Slot's `start` and `duration` are measured from
  the creatives actually spliced, rather than taken from the durations
  the ad decision declares.
* Supersede: when a splice fails, the publisher publishes a new record
  with the same `m`, which drops the failed slot (item 2 of
  {{open-issues}}).
* Heartbeat: when nothing has changed for about 3 s, the retained array
  is re-sent as a new Group, so a late joiner that starts at the next
  Group receives the records within seconds (item 3 of
  {{open-issues}}).
* Device beacons: when device beacons are enabled, the browser player
  fires tracking requests from the records on its synchronization clock
  -- the media time it is presenting, the `sync.now()` clock of the
  open-source `<moq-watch>` player element -- rather than from the
  wallclock less an assumed latency. A late joiner fires `podStart` on
  joining, nothing for the slot already in progress, and full chains for
  the slots after it. The player falls back to the earlier control-track
  model when that clock is unavailable or no record arrives within 5 s.

Measured:

* On a test rig (15 pods, one creative the importer refuses), every one
  of the 31 slot boundaries the records claimed matched the splice gaps
  in the exported media to the millisecond, and the refused creative
  produced superseding records. The durations the ad decision declared
  would have been 36 to 350 ms early.
* Replaying the rig's captured records against a simulated playhead,
  the player's fires came 0.3 to 5.0 ms after the media time, none early
  (142 fires at a 4 s playback delay).
* In an observe-only browser session against the running deployment on
  2026-10-24 (requests logged, not sent), one 4-ad pod produced 33
  events in order: `podStart`; then `impression`, `start`, the three
  quartiles and `complete` for each ad; then `podEnd`. For its 25
  time-based events, device times trailed the publisher's server-side
  tracking by 3.58 to 4.07 s, which is the configured 4 s playback
  delay, with at most 8 ms of spread within each ad.

Unchanged from the previous revision:

* Placement opportunities on the live channel detected from
  **inbound** in-band SCTE-35, parsed to a break window and duration.
  The deployment consumes SCTE-35; it does not publish a splice
  signaling track.
* Tracking indirection as described in {{capability-urls}}: a proxy
  holds vendor beacon URLs and returns compact per-event capability
  URLs, which devices request with their own client identifier, with
  per-`{uuid, event, client}` deduplication so a shared broadcast
  yields per-device counts. The deployment converged on it for a
  concrete reason: a single impression in this inventory carries
  roughly 5 to 15 vendor tracking URLs, so firing them from the client
  directly means 5 to 15 device requests per impression, multiplied by
  every subscriber to a shared broadcast. A capability URL is one device
  request that the proxy fans out server-side, which makes the
  device-side cost independent of how many vendors a creative carries
  ({{amplification}}).
* An MSF catalog, published automatically by the MoQ implementation in
  use and verified against an interop profile by a tool in the same
  codebase.

NOT yet implemented:

* Catalog listing. The `ad-creative` track is not yet listed in the MSF
  catalog, because the MoQ library in use does not yet emit
  `eventtimeline` entries; that needs an upstream change. Consumers find
  the track by name.
* The publication lead of {{publication-lead}}. Records are published
  when the break opens, immediately before the pod's first media
  Object, not a full Group ahead. Devices still hold the record before
  the splice renders because they present several seconds behind
  delivery, but the SHOULD is not met.
* Device requests on the running deployment. Its capability-URL
  endpoint is internal: the URLs it publishes are neither reachable
  from public clients nor `https` URLs ({{validation}}), so there the
  device beacons have been observed but not sent. The publisher's own
  server-side requests continue in parallel.
* `slot`, `trackingEvent` and `verification` envelopes, `$remote`, and
  the Slot members `media`, `verifications`, `skipOffset` and
  `clickThrough`.
* A splice signaling track, and so the correlation rules of
  {{correlation}}.
* The IANA registration in {{iana}}, which this document requests.

No independent implementation of this document is known to the author.

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
compose with it. Will Law also suggested splitting ad signaling by
function across Event Timeline tracks ({{future-carriage}}). The payload
data model is the work of the SVTA Advertising Working Group
{{SVTA2053}}.

{::comment} TODO: add early reviewers before submission. {:/comment}

# JSON Schema and Test Vectors {#schema}
{:numbered="false"}

A JSON Schema for the record shape and a set of test vectors are published
in the `schema/` and `vectors/` directories of this document's source
repository {{VECTORS}}.

The schema encodes the record requirements of {{record-structure}} and
{{payload}}: exactly one index reference field, typed as {{Section 8.1 of
MSF}} requires, and a `data` member holding one Version 2 envelope that
satisfies the envelope rules of Section 5.2.2.1 of {{SVTA2053}} --
`version` 2, one of the four envelope types, a non-empty `payload`
array, and no `features` flag set that {{SVTA2053}} does not define. It
does not validate the payload objects themselves; those are governed by
{{SVTA2053}}, not by this document.

The vectors come in two sets, and both matter: nine files holding eleven
records that MUST validate, and ten records that MUST NOT. A validator
that accepts everything passes the first set alone. The valid set covers
each envelope type and each index type, back-to-back placement
opportunities, the worked example of {{example}}, and one Object captured
from the running deployment. Each rejecting case is otherwise valid, so
it fails for the reason its name claims; together they pin the
constraints most likely to be implemented loosely:

| Vector | Rejected because |
|---|---|
| `two-index-fields` | carries both `m` and `t`; exactly one is allowed |
| `no-index-field` | carries none |
| `string-wallclock-index` | `t` is a date string; {{MSF}} requires a Number |
| `missing-data` | index only, no envelope |
| `v1-bare-payload` | a bare Version 1 payload object, which the DASH and HLS bindings accept and this one does not ({{payload}}) |
| `unwrapped-pod` | a Version 2 Pod object with no envelope around it |
| `wrong-envelope-version` | `"version": 1` in an otherwise Version 2 envelope |
| `unknown-envelope-type` | a `type` outside `pod`, `slot`, `trackingEvent` and `verification` |
| `empty-payload` | an empty `payload`; the envelope requires at least one object |
| `undefined-feature-flag` | sets a `features` flag that {{SVTA2053}} does not define, so a conforming interpreter discards the record |

The following record is the first of the two in the `captured-object`
vector: one Event Timeline Object, captured read-only from the running
deployment ({{impl-status}}) on 2026-10-26 and then anonymized. The
creative identifiers, the identifier scheme, and every tracking URL
(scheme, host and path) were replaced with placeholders; everything else
is as published -- the index, the MediaTime values, the slot structure,
and the event types and their order. The slot durations are measured
from the spliced media rather than declared, which is why they are not
round numbers:

~~~ json
{
  "m": 82005596,
  "data": {
    "version": 2,
    "type": "pod",
    "payload": [{
      "duration": 60.117,
      "slots": [
        {
          "type": "linear",
          "start": 0.0,
          "duration": 30.058,
          "identifiers": [{ "scheme": "urn:com:example:ads:id",
                            "value": "example-30s-a" }],
          "tracking": [
            { "type": "impression", "urls": [
              "https://beacons.example.com/c/d916217e/imp" ] },
            { "type": "start", "urls": [
              "https://beacons.example.com/c/d916217e/start" ] },
            { "type": "firstQuartile", "urls": [
              "https://beacons.example.com/c/d916217e/q1" ] },
            { "type": "midpoint", "urls": [
              "https://beacons.example.com/c/d916217e/q2" ] },
            { "type": "thirdQuartile", "urls": [
              "https://beacons.example.com/c/d916217e/q3" ] },
            { "type": "complete", "urls": [
              "https://beacons.example.com/c/d916217e/done" ] }
          ]
        },
        {
          "type": "linear",
          "start": 30.058,
          "duration": 30.059,
          "identifiers": [{ "scheme": "urn:com:example:ads:id",
                            "value": "example-30s-b" }],
          "tracking": [
            { "type": "impression", "urls": [
              "https://beacons.example.com/c/2ea7e414/imp" ] },
            { "type": "start", "urls": [
              "https://beacons.example.com/c/2ea7e414/start" ] },
            { "type": "firstQuartile", "urls": [
              "https://beacons.example.com/c/2ea7e414/q1" ] },
            { "type": "midpoint", "urls": [
              "https://beacons.example.com/c/2ea7e414/q2" ] },
            { "type": "thirdQuartile", "urls": [
              "https://beacons.example.com/c/2ea7e414/q3" ] },
            { "type": "complete", "urls": [
              "https://beacons.example.com/c/2ea7e414/done" ] }
          ]
        }
      ],
      "tracking": [
        { "type": "podStart", "urls": [
          "https://beacons.example.com/c/bf847920/start" ] },
        { "type": "podEnd", "urls": [
          "https://beacons.example.com/c/bf847920/end" ] }
      ]
    }]
  }
}
~~~

The `urls` values are capability URLs ({{capability-urls}}). No event
carries an `offset`, so each event's timing follows from its type
(Section 4.4.5 of {{SVTA2053}}). The second record of the captured
Object, about 100 s later on the same timeline, is a four-slot pod of
15 s creatives.

Apart from `captured-object`, the vectors are conformance examples
authored against this specification. Every vector was checked two ways:
against the schema, with a JSON Schema draft 2020-12 validator; and
against the record and payload checks of the implementation in
{{impl-status}}, the same checks its read-only validator applies to live
tracks, which beyond the record rules verify the {{SVTA2053}} shape of
each payload (member names and types, MediaTime values in seconds,
required identifiers, non-empty `urls`, and defined event types). Both
accept every valid vector and reject every invalid one, each for the
reason its name gives.

# Changes since draft-riedl-moq-ad-creative-signaling-00 {#changes}
{:numbered="false"}

(To be removed before publication.)

* SVTA 2053-1 conformance. The appendix example and the test vectors
  now use the member names and units of {{SVTA2053}} (`start`,
  `duration`, `offset`, `tracking`, `type`; MediaTime in seconds) in
  place of invented ones (`id`, `startTime`, `trackingEvents`, `event`;
  milliseconds), and no longer give Pod or Slot an `id`, which
  {{SVTA2053}} does not define (item 8 of {{open-issues}}).
* {{payload}}: adds the `verification` envelope type, which
  {{SVTA2053}} defines; states that interior timing is in seconds; forbids
  setting `features` flags that {{SVTA2053}} does not define (the -00
  example set two, which a conforming interpreter would discard); and
  notes two inconsistencies in {{SVTA2053}} that affect parsers.
* {{record-structure}}: index values are typed as {{MSF}} requires (`t`
  and `m` Numbers, `l` a two-Number Array; a -00 vector wrote `t` as a
  date string); records map to Objects per {{Section 8.3 of MSF}}.
  {{track-properties}} adds the `mimeType` that {{MSF}} requires.
  {{interior-timing}} says what interior timing is relative to when an
  envelope carries Slot or TrackingEvent objects without their Pod.
* The {{SVTA2053}} reference now cites the published Revision 1.0 by
  title, with the Version 2 model named in an annotation; section
  references corrected.
* New informative {{future-carriage}}: splitting ad signaling by
  function across Event Timeline tracks, break-level state in MOQT
  subgroup properties {{MOQT-SUBGROUP-PROPS}}, and the additive
  non-linear extensions of the 3rd edition {{SVTA2053-2}}.
* {{impl-status}} rewritten: the event class is now deployed, with
  measured results and an explicit list of what is not yet
  implemented. {{open-issues}} records the implementation experience
  for items 1, 2, 3 and 8, and the open status of item 4. Item 8, the
  missing placement identifier, stays open.
* {{schema}}: the vectors are replaced, the schema checks index types
  and the envelope rules, and an anonymized record captured from the
  deployment replaces the invented example.
* The MSF index-key spelling change in the MSF editor's copy is noted
  in {{conventions}}.
