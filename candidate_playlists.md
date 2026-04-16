# Candidate Playlists for Shivkumar Catalog (v2)

**Source:** `sourcehtmlshivkumar.txt` — 381 unique songs after dedupe (416 raw entries, 35 duplicates)

**Cross-reference:** All 389 songs in Kenneth's `songs_metadata.json` match entries here.

**v2 changes:**
- Fixed parser bug on semicolon-delimited title entries (now catches all ~27 previously-missed songs)
- Expanded Ganapati keyword patterns (7 → 9 songs)
- Pancharatna is complete at 4 songs: the Pancharatna Krithis are Tyagaraja's 4 greatest compositions (Jagadananda Karaka, Dudukugala, Kanakana Ruchira, Endaro Mahanubhavulu) — 4 is the canonical set, not a data gap.

## How to use this file

1. Pick a playlist below.
2. ctrl-F each song title in `sourcehtmlshivkumar.txt` to confirm it exists.
3. Copy `title` + `composer` into your `playlists.json`.
4. Each playlist targets 5–20 songs (the paper's recommended query size is 5–25).

## Playlist design philosophy

Each playlist has a *coherent intent* (theme, composer, raga, cycle) that cuts across metadata in a specific way. The eval harness will leave some songs out of each playlist and measure whether the algorithm recovers them using the rest as a query.

Playlists are designed across a spectrum:
- **Canonical cycles** (Thiruppavai, Navavarnam, Pancharatna) — strongest possible CF signal, songs are always performed together.
- **Theme-based** (Ganapati, Rama, Devi) — coherent devotional intent that is NOT encoded in the property labels; tests whether CF actually adds value over property filtering.
- **Composer-based** (Tyagaraja, Dikshitar, Papanasam Sivan) — composer coherence plus raga diversity.
- **Single-raga controls** (Kalyani, Bhairavi, Thodi) — tests whether the algorithm degenerates into pure property lookup when the playlist collapses onto one ragam.

---

## Playlist 1: Thiruppavai — first 15 pasurams (Andal)

*Intent:* Andal's devotional cycle, pasurams 1–15. Coherent by author+cycle, cuts across ragas. Tests whether algorithm learns 'same cycle' relationships that aren't in the property labels.

*Size:* 15 songs

- **Margazhi Thingal (Thiruppavai Pasuram #01)** — Nata; Andal
- **Vaiyathu VaazveergaaL (Thiruppavai Pasuram #02)** — Gowlai; Andal
- **Ongi Ulagalandha (Thiruppavai Pasuram #03)** — Arabhi; Andal
- **Aazhi Mazhai Kanna (Thiruppavai Pasuram #04)** — Varali; Andal
- **Maayanai Mannu (Thiruppavai Pasuram #05)** — Sri Ragam; Andal
- **Pullum Silambina (Thiruppavai Pasuram #06)** — Shankarabharanam; Andal
- **Kisu Kisu Enru (Thiruppavai Pasuram #07)** — Bhairavi; Andal
- **Kizh Vanam (Thiruppavai Pasuram #08)** — Dhanyasi; Andal
- **ThUmani mAdathu (Thiruppavai Pasuram #09)** — Hamir Kalyani; Andal
- **NoRRu Chuvarkkam (Thiruppavai Pasuram #10)** — Thodi; Andal
- **Katru Karuvai (Thiruppavai Pasuram #11)** — Huseni; Andal
- **Kanaithillan Katrrerumai (Thiruppavai Pasuram #12)** — Kedaragowlai; Andal
- **Pullin Vaay Kidanay (Thiruppavai Pasuram #13)** — Atana; Andal
- **Ungkal Puzhai (Thiruppavai Pasuram #14)** — Ananda Bhairavi; Andal
- **EllE Ilang KiliyE (Thiruppavai Pasuram #15)** — Begada; Andal

## Playlist 2: Thiruppavai — pasurams 16–30 (Andal)

*Intent:* Second half of Andal's cycle. Should recommend pasurams from the first half given held-out queries. Strong CF signal expected.

*Size:* 15 songs

- **nAyakanAi ninra (Thiruppavai Pasuram #16)** — Durbar; Andal
- **amparamE thaNNIrE (Thiruppavai Pasuram #17)** — Kalyani; Andal
- **Unthu Matha Kalitran (Thiruppavai Pasuram #18)** — Saveri; Andal
- **Kuthu Vilakkeriya (Thiruppavai Pasuram #19)** — Sahana; Andal
- **Muppathi mUvar (Thiruppavai Pasuram #20)** — Senjurutti; Andal
- **Etrra Kalangkal (Thiruppavai Pasuram #21)** — Nadanamakriya; Andal
- **AngkaN Maa NyAlathu (Thiruppavai Pasuram #22)** — Yamuna Kalyani; Andal
- **mAri malai (Thiruppavai Pasuram #23)** — Manirangu; Andal
- **Anru Ivvulagam (Thiruppavai Pasuram #24)** — Sindhu Bhairavi; Andal
- **Oruthi MaganAi (Thiruppavai Pasuram #25)** — Behag; Andal
- **mAlE manivannA (Thiruppavai Pasuram #26)** — Kunthalavarali; Andal
- **Koodarai Vellum (Thiruppavai Pasuram #27)** — Purvi Kalyani; Andal
- **Karavaigal Pin Cendru (Thiruppavai Pasuram #28)** — Khamboji (Kambodhi); Andal
- **Sitran Siru kAlE (Thiruppavai Pasuram #29)** — Malayamarutham; Andal
- **Vanga Kadal(Thiruppavai Pasuram #30)** — Surutti; Andal

## Playlist 3: Dikshitar Navavarnam (Kamakshi cycle)

*Intent:* Dikshitar's 9 krithis praising Kamakshi at Kanchipuram — each in a different raga. Canonical cycle. Tests whether the algorithm can learn 'same cycle' via playlist co-occurrence when shared metadata (ragam) differs across every song.

*Size:* 11 songs

- **Kamalambambike** — Thodi; Dikshitar ( Navavarnam Dhyana Krithi )
- **Kamalamba Samrakshatu** — Ananda Bhairavi; Dikshitar ( Navavarnam #1 )
- **Kamalambam Bhajare** — Kalyani; Dikshitar ( Navavarnam #2 )
- **Sri Kamalaambikayaa Kataakshitoham** — Shankarabharanam; Dikshitar ( Navavarnam #3 )
- **Kamalaambikayai** — Kambodhi; Dikshitar ( Navavarnam #4 )
- **Shree Kamalaambikaayaah Param Nahire** — Bhairavi; Dikshitar ( Navavarnam #5 )
- **Kamalaambikaayaastava Bhaktoham** — Punnagavarali; Dikshitar ( Navavarnam #6 )
- **Sri Kamalambikayam Bhaktim Karomi** — Sahana; Dikshitar ( Navavarnam #7 )
- **Shree Kamalaambike Avaava** — Ghanta; Dikshitar ( Navavarnam #8 )
- **Shree Kamalamba Jayati** — Ahiri; Dikshitar ( Navavarnam #9 )
- **Shree Kamalaambike Shive** — Sri Ragam; Dikshitar (  Navavarnam Mangala Krithi )

## Playlist 4: Tyagaraja Pancharatna Krithis

*Intent:* The Pancharatna Krithis — Tyagaraja's 4 greatest compositions, always performed together at the Thyagaraja Aradhana. Canonical set, strongest possible CF signal. Query size (4) is slightly below the paper's ideal 5–25 but acceptable given this is the full canonical set.

*Size:* 4 songs

- **Dudukugala** — Gowlai; Tyagaraja
- **Endaro Mahanu Bhavulu** — Sri; Tyagaraja
- **Jagadananda Karaka** — Nattai; Tyagaraja
- **KanaKanaRuchira** — Varali; Tyagaraja

## Playlist 5: Invocations to Ganapati

*Intent:* Songs praising Ganesha. Cuts across ragas and composers — devotional theme is the only common thread. Tests whether algorithm can learn theme via playlist co-occurrence when themes aren't in the property labels (ragam/talam/composer/mela).

*Size:* 9 songs

- **Gajananayutham** — Chakravakam; Dikshitar
- **Gajavadana** — Sri Ranjani; Papanasam Sivan
- **Gajavadana** — Thodi; Kumara Ettendra
- **Siddhi Vinayakam** — Shanmukhapriya; Dikshitar
- **Sri Ganapathini** — Sowrastram; Tyagaraja
- **Sri Mahaganapathim Bhajeham** — Atana; HH Jayachamaraja Wodeyar
- **Sri Mahaganapathi** — Gowlai; Muthuswamy Dikshitar
- **Vatapi Ganapathim** — Hamsadhwani; Dikshitar
- **Vinayakuni** — Madhyamavathi; Tyagaraja

## Playlist 6: Rama bhakti

*Intent:* Songs on Lord Rama — Tyagaraja wrote many, others contributed. Coherent devotional theme. Should pull more Tyagaraja Rama krithis via PPR even if the query contains only a few.

*Size:* 16 songs

- **Bhavayami Raghuramam** — Ragamalika; Swati Tirunal
- **DAsharathi Ni Runamu** — Thodi; Tyagaraja
- **MarugelarA O RaghavA** — JayanthasrI; Tyagaraja
- **mOhana rAmA** — Mohanam; Tyagaraja
- **Namo Namo Raghukula Nayaka** — Nattai; Annamacharya
- **Pahi Rama Doota** — Shadvidhamargini; Tyagaraja. Learnt From Recording of: C.V.Shankar
- **Raghunayaka** — Hamsadhwani; Tyagaraja
- **Ramachandram Bhaavayami** — Vasanta; Dikshitar
- **Rama Dayajudave** — Dhanyasi; Bhadrachala Ramadas
- **Rama Nannu Brovara** — Hari Kambodhi; Tyagaraja
- **Rama Ika Nannu** — Sahana; Tyagaraja
- **Rama Katha Sudha** — Madhyamavathi; Tyagaraja
- **Rama Neepai Tanaku** — Kedaram; Tyagaraja
- **Rama Nee Samana** — Kharaharapriya; Tyagaraja
- **Rama Ninnu Nammina** — Mohanam; Tyagaraja
- **Teliyaleru Rama** — Dhenuka; Tyagaraja

## Playlist 7: Devi / Shakti krithis

*Intent:* Songs praising the goddess across her many forms (Kamakshi, Meenakshi, Lalitha, etc.). Excludes Navavarnam krithis (already their own playlist).

*Size:* 20 songs

- **Abhayambikaya** — Kedaragowla; Dikshitar
- **Amba Neelayatakshi** — Neelambari; Dikshitar
- **Amba Vani** — Keeravani; Mutthaiah Bhagavatar
- **Janani Ninnu Vina** — Reethigowlai; Subbaraya Shastry
- **Janani Maamava** — Bhairavi; Swati Tirunal
- **Kamakshi (Swarajati)** — Bhairavi; Shyama Shastry
- **Kamakshi Sri Varalakshmi** — Bilahari; Dikshitar
- **Kamakshi (Swarajati)** — Yadukula Khambodhi; Shyama Shastry
- **Lalithe** — Yadukula Kambodhi; Chengalvaraya Shastri
- **Madhurambikayam** — Hemavathi; Dikshitar
- **Mahalakshmi Jaganmata** — Shankarabharanam; Papanasam Sivan
- **Mamava Meenakshi** — Varali; Dikshitar
- **Meenakshi Me Mudam** — Purvi Kalyani; Dikshitar
- **Nanu Brovu LalithA** — Lalitha; Shyama Shastry
- **Nirajakshi Kamakshi** — Hindolam; Dikshitar
- **Pahimaam Sri RajaRajeshwari** — Janaranjani; Maha Vaidyanatha Iyer. Learnt From Recording of: Semmangudi
- **Palimchu Kamakshi** — Madhyamavathi; Shyama Shastri
- **Parvati Pathim** — Hamsadhwani; Dikshitar
- **Shankari Shankuru** — Saveri; Shyama Shastri
- **Sri Kamakshi** — Saaranga; Annaswamy Shastry

## Playlist 8: Tyagaraja in the five heavy ragas

*Intent:* Tyagaraja krithis in the 5 'big' Carnatic ragas (Thodi, Bhairavi, Shankarabharanam, Kalyani, Kharaharapriya). Tests composer+ragam interaction — both properties are shared but the combination is specific.

*Size:* 15 songs

- **Aragimpave** — Thodi; Tyagaraja
- **Bhakthi Biccha** — Shankarabharanam; Tyagaraja
- **Chakkani Raja** — Kharaharapriya; Tyagaraja
- **DAsharathi Ni Runamu** — Thodi; Tyagaraja
- **Eduta Nilachite** — Shankarabharanam; Tyagaraja
- **Emi JesithE** — Thodi; Tyagaraja
- **Enati Nomu** — Bhairavi; Tyagaraja
- **Enduku Peddala** — Shankarabharanam; Tyagaraja
- **Kaddanuvariki** — Thodi; Tyagaraja
- **Koluvamaregada** — Thodi; Tyagaraja
- **Manasu Swaddhina** — Shankarabharanam; Tyagaraja
- **Mitri BhagyamE** — Kharaharapriya; Tyagaraja
- **Neevanti Deivamunu** — Thodi; Tyagaraja
- **Nidhi ChAla SukhamA** — Kalyani; Tyagaraja
- **Prakkala Nilabadi** — Kharaharapriya; Tyagaraja

## Playlist 9: Dikshitar sampler

*Intent:* Range of Dikshitar compositions excluding the Navavarnam cycle. Cuts across ragas; composer-driven coherence.

*Size:* 15 songs

- **Abhayambikaya** — Kedaragowla; Dikshitar
- **AkhilAndEsvari RakshamAm** — Dwijavanthi; Dikshitar
- **Amba Neelayatakshi** — Neelambari; Dikshitar
- **Ananda Natana Prakasam** — Kedaram; Dikshitar
- **Angaarakamaashrayaami** — Surutti; Dikshitar
- **Annapurne** — Sama; Dikshitar
- **ardhanArIshvaram** — Kumudakriya; Dikshitar
- **Arunaachala Naatham** — Saaranga; Dikshitar
- **Balagopala** — Bhairavi; Dikshitar
- **Balasubramanyam Bhajeham** — Surutti; Dikshitar
- **Budhamashrayami (Navagraha Krithi)** — Nata Kuranji; Dikshitar
- **Chandram Bhaja (Navagraha Krithi)** — Asaveri; Dikshitar
- **Chetashree** — Dwijavanthi; Dikshitar
- **Chintayamaa** — Bhairavi; Dikshitar
- **Dakshinamurthe** — Shankarabharanam; Dikshitar

## Playlist 10: Papanasam Sivan sampler

*Intent:* Modern-era composer; Tamil compositions. Tests whether algorithm handles minority composers with good recall.

*Size:* 15 songs

- **Andavane** — Shanmukhapriya; Papanasam Sivan
- **Balakrishnan** — Dhanyasi; Papanasam Sivan
- **Devi Neeye Thunai** — Keeravani; Papanasam Sivan
- **Enna Thavam** — Kapi; Papanasam Sivan
- **Enna Thavam Seidanai** — Kapi; Papanasam Sivam
- **Gajavadana** — Sri Ranjani; Papanasam Sivan
- **Idadhu Padam Thooki** — Khamas; Papanasam Sivan
- **Jaanaki Pathe** — Kharaharapriya; Papanasam Sivan
- **Kaa vaa vaa** — Varali; Papanasam Sivan
- **Kapali** — Mohanam; Papanasam Sivan
- **Karpagame** — Madhyamavathi; Papanasam Sivan
- **Kumaranthaal** — Yadukula Kambodhi; Papanasam Sivan
- **Maal Maruga** — Vasantha; Papanasam Sivan
- **Maa Ramanan** — Hindolam; Papanasam Sivan
- **Mahalakshmi Jaganmata** — Shankarabharanam; Papanasam Sivan

## Playlist 11: Kalyani ragam (control)

*Intent:* All Kalyani songs in the catalog. Same-raga control — will expose whether the algorithm adds value beyond pure property filtering. If a same-raga playlist produces the same recommendations as raw property lookup, the CF signal isn't helping.

*Size:* 8 songs

- **Alamelu Manga Nee** — Kalyani; Annamacharya
- **amparamE thaNNIrE (Thiruppavai Pasuram #17)** — Kalyani; Andal
- **Himadri Suthe PAhimAm** — Kalyani; Shyama Shastry
- **Kamalambam Bhajare** — Kalyani; Dikshitar ( Navavarnam #2 )
- **Nidhi ChAla SukhamA** — Kalyani; Tyagaraja
- **Pankaja Lochana** — Kalyani; Swati Tirunal
- **Sivakameshwari** — Kalyani; Dikshitar
- **SivE PAhimAm** — Kalyani; Tyagaraja

## Playlist 12: Bhairavi ragam (control)

*Intent:* All Bhairavi songs in the catalog. Same-raga control — will expose whether the algorithm adds value beyond pure property filtering. If a same-raga playlist produces the same recommendations as raw property lookup, the CF signal isn't helping.

*Size:* 10 songs

- **Balagopala** — Bhairavi; Dikshitar
- **Chintayamaa** — Bhairavi; Dikshitar
- **Enati Nomu** — Bhairavi; Tyagaraja
- **Janani Maamava** — Bhairavi; Swati Tirunal
- **Kamakshi (Swarajati)** — Bhairavi; Shyama Shastry
- **Shree Kamalaambikaayaah Param Nahire** — Bhairavi; Dikshitar ( Navavarnam #5 )
- **Kisu Kisu Enru (Thiruppavai Pasuram #07)** — Bhairavi; Andal
- **Sri Lalithe** — Bhairavi; Annaswami Shastry
- **Upacharamu jEsEvaru** — Bhairavi; Tyagaraja
- **yArO ivar yArO** — Bhairavi; Arunachala Kavi

## Playlist 13: Thodi ragam (control)

*Intent:* All Thodi songs in the catalog. Same-raga control — will expose whether the algorithm adds value beyond pure property filtering. If a same-raga playlist produces the same recommendations as raw property lookup, the CF signal isn't helping.

*Size:* 13 songs

- **Aragimpave** — Thodi; Tyagaraja
- **DAsharathi Ni Runamu** — Thodi; Tyagaraja
- **Emi JesithE** — Thodi; Tyagaraja
- **Gajavadana** — Thodi; Kumara Ettendra
- **Kaddanuvariki** — Thodi; Tyagaraja
- **Kamalambambike** — Thodi; Dikshitar ( Navavarnam Dhyana Krithi )
- **Koluvamaregada** — Thodi; Tyagaraja
- **Neevanti Deivamunu** — Thodi; Tyagaraja
- **Ninnu Vina** — Thodi; Dikshitar. Learnt From Recording of: M.N. Subramanyam
- **NoRRu Chuvarkkam (Thiruppavai Pasuram #10)** — Thodi; Andal
- **Rave Himagiri (Swarajati)** — Thodi; Shyama Shastri
- **Sri Krishnam Bhaja** — Thodi; Dikshitar
- **ThAyE yasOdhA** — Thodi; OothukaDu Venkata Subbaiyer
