# Dataset source

`attacks.csv.gz` is a compressed, unmodified snapshot of `attacks.csv` from the
[javierIA GitHub gist](https://gist.github.com/javierIA/f404c5b368e878da515028074882998d),
pinned to gist revision `74faa7572c5b4a61214d3bfc92334da74c5d637b` (raw file object
`0f8962c3da0b752f1ac8c638c66863a7d3ff2072`). The snapshot contains Global Shark
Attack File records through June 25, 2018 and has the same legacy columns used by the
retired OpenDataSoft catalog.

Uncompressed SHA-256:
`979b6e0d9868be9487b23fcbbf5b52f594fcc2d51be65ea32d4d13f10e225877`

This frozen dataset exists to keep the programming exercise reproducible. It is not a
live incident feed and must not be presented as current research data. The original
records are attributed to the Global Shark Attack File. Retain this attribution when
redistributing the snapshot. The API parser excludes seven empty spreadsheet tail rows
whose only populated values are `case_number=0` and synthetic order numbers; it exposes
the remaining 6,302 incident rows.
