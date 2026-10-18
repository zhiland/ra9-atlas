# Detroit: Become Human — preliminary flowchart source review

Date: October 17, 2026.

This is a limited survey of sources to plan further research, not an exhaustive search or a check of every game node. Available pages, indexes, and the structure of selected primary sources were reviewed; content completeness and accuracy against the game still need confirmation in the main research.

## Resources

| Resource | What was actually available | Value for further research | Limitations / rights |
|---|---|---|---|
| [fschutt/detroit-become-human-flowchart (GitHub)](https://github.com/fschutt/detroit-become-human-flowchart) and [published preview](https://fschutt.github.io/detroit-become-human-flowchart/) | The README says the project is “not yet finished.” The repository contains a `chapters` folder, HTML template, CSS/JS, and Python generator. The README names YAML + Jinja2 (and MyPy) for regeneration. The generator loads YAML fields `title`, `description`, `playing_as`, and `choices`, then renders HTML. The preview is available, but the indexer shows almost no content. | The most promising source for a reproducible interactive map and machine-readable choice model; its data schema, UI, and chapter/branch coverage can be studied. | The author marks the work unfinished. Code structure does not prove chapter completeness or accuracy against the game. No license was visible on the inspected page; do not assume reuse is allowed without checking LICENSE and the author’s rights separately. |
| [PowerPyx: Full Walkthrough – All Chapters](https://www.powerpyx.com/detroit-become-human-full-walkthrough-all-chapters/) | The text index numbers 32 chapters. Crossroads links are split into Kara, Connor, and Markus; Battle for Detroit is also split into three character pages. Separate pages contain long text walkthroughs and links/images; Crossroads Kara/Connor and Battle for Detroit Kara were among those reviewed. | Useful control structure for chapters and character branches; explains steps and conditions in detail and helps find alternative routes and cross-check them. | The site itself claims 100% flowchart completion, but that claim is not independent verification. The pages are guides, not a structured complete node database. No explicit license or reuse permission was found on the checked page. |
| [Detroit: Become Human Wiki — Category:Walkthroughs (Fandom)](https://detroit-become-human.fandom.com/wiki/Category:Walkthroughs) | The web index shows a category described as walkthroughs with flowcharts for each chapter; it displays “All items (35)” and a list of pages. A search snippet for [The Nest](https://detroit-become-human.fandom.com/wiki/The_Nest) promises a text version of the flowchart and a video of the in-game chart. Direct access to the article failed (access error/402). | Potentially the most detailed text inventory of nodes and conditions; useful to find branches and checkpoints. | Community-edited, so omissions, disputed wording, and drift are possible. The category page states CC-BY-SA unless otherwise noted; check attribution and terms on every page used. 35 is the number of category items, not a confirmed number of game chapters. |
| [Detroit: Become Human — Fandom overview](https://detroit-become-human.fandom.com/wiki/Detroit%3A_Become_Human) | A search snippet shows a chapter table, including chapter 32 Battle for Detroit and three characters. Direct access returned 402, so the table was not checked directly. | Additional check of numbering and character subchapters. | Access is limited; this is a secondary fan source. Do not use one snippet as proof of a complete list. |
| [Detroit: BecomeHuman Text Transcription](https://detroitbecometext.github.io/) | A published fan transcript with an index that lists chapter numbers and routes within the final chapters separately (for example, Crossroads 30.1–30.3, Night of the Soul 31.1–31.2, Battle for Detroit 32.1–32.6). The search index showed the contents; direct HTML access yielded no extractable lines. | A useful independent pointer to the difference between a chapter number and a subroute, and a possible text source for targeted scene/dialogue checks. | It is a transcript, not a flowchart. Authorship, completeness, and license have not been established; use caution when quoting or copying protected game text. |
| [Neoseeker: Chapter Flowcharts](https://www.neoseeker.com/detroit-become-human/Appendix/Chapter_Flowcharts) | A search result describes flowcharts with unlockable actions/choices for 100% completion, but directly warns that several chapters are missing. Direct access returned 403. | May provide another independent grid of conditions/coverage; useful only for checking pages that are available. | Access and coverage are limited; the search description notes gaps. |
| [EdrawMax: Detroit Become Human Flowcharts – All Chapters](https://www.edrawsoft.com/article/detroit-become-human-flowchart.html) | The article displays chapter headings and embedded flowchart images. The visible sequence starts with Hostage and lists content, but some titles and numbering differ from PowerPyx (for example, numbering shifts by one after Opening is omitted). | Visual reference and image source for a quick sense of scale and chart layout. | The article promotes its own diagram editor, and its “100%” label does not prove completeness. Embedded images are raster and do not reliably expose every condition. No explicit image reuse license was visible on the reviewed page. |
| [GameFAQs forum post pointing to Agoxen guide](https://gamefaqs.gamespot.com/boards/182637-detroit-become-human/77846501) | A 2019 post by the guide author links to their own flowchart guide and explicitly notes incomplete values: Zlatko 95%, Last Chance Connor 98%, Markus’ Revolution 98%; it also invites reports of omissions. | Useful evidence that fan 100% guides remained incomplete at different times; a lead for finding the Agoxen map. | Forum post and external link; the percentages are historical, not a current assessment. The external guide was not separately verified. |

## 32 chapters and 35 walkthrough items

Safe confirmed wording: **PowerPyx numbers 32 chapters**, while the Fandom page reports **35 category items**. These are different units, so “35” does not establish that the game has 35 chapters.

The visible Fandom category includes chapter headings as well as three character category pages (Connor’s Chapters, Kara’s Chapters, Markus’s Chapters). PowerPyx keeps 32 chapter numbers but splits some sections into multiple walkthrough URLs: Crossroads has three character pages, as does Battle for Detroit. These facts explain why the number of pages/items can differ from the number of numbered chapters, but **do not justify equating Fandom’s 35 items with a specific set of 32 chapters plus three routes**: the category includes its own category pages, and the sites organize pages differently.

The fan transcript shows a finer breakdown: its contents lists route suffixes within chapters 30 and 32, and chapter 31 also has two subsections. This supports distinguishing a chapter number, story route/subchapter, and guide webpage. It does not prove that all such subsections are separate game chapters.

## Recommendations for full research

1. First establish the canonical list of 32 numbered chapters from an in-game or authoritative source; describe playable routes and guide pages separately.
2. Inspect the GitHub YAML and generator to assess actual coverage and extract the interactive project structure, but do not treat it as complete because the author marks it unfinished.
3. Cross-check nodes and conditions in Fandom against PowerPyx and in-game flowcharts/video captures; mark conflicts and uncertainty, especially in Crossroads and Battle for Detroit.
4. Check licenses and rights separately before reusing text or images; public access does not grant permission to copy.

## Checked page links

- GitHub repo: https://github.com/fschutt/detroit-become-human-flowchart
- GitHub chapter data folder: https://github.com/fschutt/detroit-become-human-flowchart/tree/master/chapters
- GitHub preview: https://fschutt.github.io/detroit-become-human-flowchart/
- PowerPyx index: https://www.powerpyx.com/detroit-become-human-full-walkthrough-all-chapters/
- PowerPyx Crossroads Kara: https://www.powerpyx.com/detroit-become-human-crossroads-kara-walkthrough-100/
- PowerPyx Crossroads Connor: https://www.powerpyx.com/detroit-become-human-crossroads-connor-walkthrough-100/
- PowerPyx Battle for Detroit Kara: https://www.powerpyx.com/detroit-become-human-battle-for-detroit-kara-walkthrough-100/
- Fandom category: https://detroit-become-human.fandom.com/wiki/Category:Walkthroughs
- Fan transcript: https://detroitbecometext.github.io/
- Neoseeker flowcharts: https://www.neoseeker.com/detroit-become-human/Appendix/Chapter_Flowcharts
- EdrawMax article: https://www.edrawsoft.com/article/detroit-become-human-flowchart.html
- GameFAQs note: https://gamefaqs.gamespot.com/boards/182637-detroit-become-human/77846501
