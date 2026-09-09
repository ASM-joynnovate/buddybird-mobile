# Profile identifiers and custom session duration compatibility

Reference: v1.1.0, d5464b7. These are identifier/label mappings and observable input/output calculations, newly documented by the authorized compatibility investigator. No implementation is included.

## Species

Predefined species values are exactly the IDs below. Persist IDs, not translated labels. Ordering is group order small, medium, large, then table order within each group.

| Group  | Stored ID      | Korean label   | English label   |
| ------ | -------------- | -------------- | --------------- |
| small  | `budgie`       | 사랑앵무(잉꼬) | Budgie          |
| small  | `cockatiel`    | 왕관앵무       | Cockatiel       |
| small  | `lovebird`     | 모란앵무       | Lovebird        |
| small  | `parrotlet`    | 유리앵무       | Parrotlet       |
| medium | `conure`       | 코뉴어         | Conure          |
| medium | `quaker`       | 퀘이커         | Quaker          |
| medium | `caique`       | 카이큐         | Caique          |
| medium | `ringneck`     | 목도리앵무     | Indian Ringneck |
| medium | `senegal`      | 세네갈앵무     | Senegal         |
| medium | `lory`         | 로리앵무       | Lory            |
| large  | `african-grey` | 회색앵무       | African Grey    |
| large  | `eclectus`     | 뉴기니아앵무   | Eclectus        |
| large  | `amazon`       | 아마존앵무     | Amazon          |
| large  | `cockatoo`     | 코카투         | Cockatoo        |
| large  | `macaw`        | 금강앵무       | Macaw           |

Group label pairs: small = 소형 / Small; medium = 중형 / Medium; large = 대형 / Large. A custom species stores trimmed user text, maximum input length 50. Unknown existing species strings display as trimmed literal text. Historical `parakeet` maps to `budgie` during migration, and historical `custom` plus `customSpecies` follows the rule in data-native.md.

## Duration selection

Initial setup defaults to the medium preset: 80 minutes, 4 cycles, each 600 seconds learning + 300 seconds rest + 300 seconds care. Selecting custom resets selection to 25 minutes, including when switching back to custom after another preset.

Custom UI has separate hour values 0 through 23 and minute values 0 through 59, both integers. Total selected minutes = 60 × hours + minutes. The selectable range includes zero, but zero is invalid, displays the duration validation error and cannot start a session. Valid selectable range is therefore 1 through 1439 minutes (23h 59m), in one-minute steps. The 24-hour value is not selectable. No separate server/native maximum was found; this is the exposed UI range.

## Custom timing calculation

The requested total duration remains the exact selected duration. It must not be rounded to a multiple of the derived cycle length. All following units are seconds unless explicitly stated; round means nearest integer, with a positive half rounded upward, matching JavaScript Math.round for nonnegative inputs.

1. Let T be selected minutes × 60. For T = 0 the three phase durations are zero and starting is blocked.
2. Pick an approximate cycle count N as the nearest integer to T/1200, with a minimum of one.
3. Let C be T/N rounded to the nearest second.
4. Care duration K is the lesser of 300 and the floor of C/4. Let B = C − K, the remainder available for learning and rest.
5. Candidate learning duration is two thirds of B rounded to the nearest whole minute, with a minimum of 60 seconds. Candidate rest duration is B minus that learning duration, also with a minimum of 60 seconds.
6. If the two candidate durations fit in B, use them. Otherwise the minute minimums cannot both fit: learning becomes two thirds of B rounded to the nearest second, with a minimum of one second; rest is exactly the remaining B minus learning. Keep K unchanged.
7. Displayed total cycle count is the ceiling of T divided by the resulting sum of all three phases, with a minimum of one. This is not necessarily N because per-cycle seconds were rounded. Stop at T even if the final cycle is partial.

Representative outcomes (learning/rest/care are seconds per cycle):

| Custom minutes | Learning | Rest | Care | Display cycles | Total seconds |
| -------------- | -------: | ---: | ---: | -------------: | ------------: |
| 0              |        0 |    0 |    0 |     1, invalid |             0 |
| 1              |       30 |   15 |   15 |              1 |            60 |
| 2              |       60 |   30 |   30 |              1 |           120 |
| 3              |       90 |   45 |   45 |              1 |           180 |
| 4              |      120 |   60 |   60 |              1 |           240 |
| 10             |      300 |  150 |  150 |              1 |           600 |
| 15             |      480 |  195 |  225 |              1 |           900 |
| 20             |      600 |  300 |  300 |              1 |          1200 |
| 25             |      780 |  420 |  300 |              1 |          1500 |
| 29             |      960 |  480 |  300 |              1 |          1740 |
| 30             |      480 |  195 |  225 |              2 |          1800 |
| 31             |      480 |  218 |  232 |              2 |          1860 |
| 59             |      600 |  285 |  295 |              3 |          3540 |
| 1439           |      600 |  300 |  299 |             73 |         86340 |

At 1439 minutes the approximate count is 72 but a cycle is 1199 seconds: 72 cycles use 86328 seconds and the last 12 seconds begin a 73rd learning phase. That is a consequence of the baseline calculation. Do not silently convert the requested total to 86328 or 87527 seconds.

For total learning time in a partial final cycle, use the learning duration of every fully elapsed cycle plus the lesser of (remaining seconds in final cycle, learning phase duration). Do not credit an entire extra learning phase just because displayed cycle count was rounded upward.

## Additional input and recording constraints

Profile name: required after trimming leading/trailing whitespace. No explicit maximum length or character-format restriction is applied by the baseline profile input or validation. Preserve existing names without truncation. Predefined/custom species is also required after trimming; only custom species input has the 50-character UI limit.

Birth date: optional as explicit null (unknown); otherwise calendar YYYY-MM-DD. Picker years run inclusively from current local year minus 100 to current local year. If an existing stored birth year is older, expand the lower bound to that saved year rather than clamping/deleting it. Months are 1–12; day options follow the actual month/year. Changing month/year clamps the prior day to the new month's final day. Future dates are rejected on save; the current-year picker can expose a future month/day but validation prevents committing it.

Recorded word label: required after trimming, with no explicit maximum length or character-format restriction at the baseline input. Creation additionally requires a completed playable recording. Do not copy API field length limits into the stored user text; upload formatting limits are a separate contract.

User word recording stops automatically at 60,000 ms, with manual stop also available. Baseline uses a timer to request stop at that point; real encoded duration can exceed it slightly. No nonzero minimum duration validation was found. Word recording is blocked while native learning state is starting, running, paused or interrupted.

User word audio output is m4a AAC, requested at 44,100 Hz, 2 channels, 128,000 bits/s. iOS requested maximum encoder quality (127) with AAC output; Android requested MPEG4 container/AAC encoder. Metering is enabled and observed about every100 ms. These are recording requests, not proof of actual hardware output; verify encoded output on devices. Native automatic learning captures remain a different contract:16,000 Hz mono PCM16 WAV and10-second segment ceiling.
