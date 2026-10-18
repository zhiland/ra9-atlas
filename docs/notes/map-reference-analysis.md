# Steam flowchart reference: selected image OCR and structure

Date: 2026-10-18. Source: [StongLory, *Detroit: Become Human | 100% Chapter Flowcharts*](https://steamcommunity.com/sharedfiles/filedetails/?id=2162781882). The guide credits `/u/throwawaydeviant9` for the original screenshots and Krystal109/Neoseeker for high-resolution versions. The page showed a removed-item notice, but its embedded images remained accessible. The images are research evidence only and are not included in the prototype.

## Method and scope

I obtained the guide's embedded PNGs for **The Hostage** (7288 × 2648) and **A New Home** (6743 × 1300). Tesseract `eng --psm 11` produced draft OCR; I checked the labels and line routes against the high-resolution images. This is a **representative partial transcription**, not exhaustive OCR of the guide, proof of all branches, or direct gameplay verification. Text on the image is a screenshot of a game flowchart. This reference supports visual structure; the D1–D3 evidence notes govern gameplay claims in the mockup.

## The Hostage: OCR transcription with visible links

The screenshot is a wide left-to-right directed graph. Larger stage containers hold smaller actions. Thin orthogonal lines split, continue, and rejoin. Outcomes sit at the far right/top/bottom; several can be visible at once. The following links were visually readable:

```text
MISSION START → TALK TO CAPT. ALLEN → SEARCH FOR CLUES
SEARCH FOR CLUES → INVESTIGATE FATHER'S BODY → LEARN CAUSE OF INCIDENT
SEARCH FOR CLUES → LEARN DEVIANT'S NAME
SEARCH FOR CLUES → INVESTIGATE GUN CASE
SEARCH FOR CLUES → INVESTIGATE COP'S BODY → {TAKE COP'S GUN | LEAVE COP'S GUN}
SEARCH FOR CLUES → {WASTED TOO MUCH TIME | GO OUTSIDE} → CONFRONT DEVIANT OUTSIDE
CONFRONT DEVIANT OUTSIDE → NEGOTIATE WITH DEVIANT
NEGOTIATE WITH DEVIANT → {FRIENDLY APPROACH | COLD APPROACH}
NEGOTIATE WITH DEVIANT → {REFUSE TO DISMISS HELICOPTER | DISMISS HELICOPTER}
NEGOTIATE WITH DEVIANT → {BE HONEST ABOUT GUN | LIE ABOUT GUN}
NEGOTIATE WITH DEVIANT → {SACRIFICE SELF | USE GUN | GET CLOSE ENOUGH}
LIE TO DEVIANT → {FAIL TO BUILD TRUST | BUILD TRUST}
```

The OCR text also read these terminal labels: `CONNOR FAILED TO REACH DEVIANT IN TIME`, `CONNOR LEAPT FOR EMMA AND FELL`, `SNIPERS SHOT DEVIANT`, `CONNOR DIED PROTECTING EMMA`, `DEVIANT SHOT CONNOR`, and `CONNOR SHOT DEVIANT`. The image contains several long orthogonal lines near those outcomes. I have **not** assigned all of them to exact incoming actions, because the crossings and text become ambiguous when reduced to a text transcription. One label appears as `BE HONEST WITH DEVIANT`; the exact placement of its incoming line is not transcribed. The visual label is `LEAVE WOUNDED COP / SAVE WOUNDED COP` near the hostage scene; the OCR missed part of it. The prototype shows only the D1 chain and selected context branches for which the source notes provide separate guide support.

## A New Home: OCR transcription with visible links

The screenshot has the same left-to-right layout. A central `CLEAN FIRST FLOOR` stage branches into chores, then continues to upstairs and `CLEAN SECOND FLOOR`. On its right, the visually readable Alice sequence is:

```text
WELCOME HOME → JOIN TODD → CLEAN FIRST FLOOR
CLEAN FIRST FLOOR → ASK TO GO UPSTAIRS → GO UPSTAIRS → CLEAN SECOND FLOOR
CLEAN SECOND FLOOR → CLEAN ALICE'S ROOM → TALK WITH ALICE
TALK WITH ALICE → ALICE GIVES KARA A KEY → OPEN ALICE'S BOX
```

The OCR also read `CHECK BACKYARD`, `TAKE OUT TRASH`, `WASH DISHES`, `CLEAN TOILET`, `CLEAN BATHROOM`, `ACTIVATE VACUUM`, `READ “ANDROID POWER!”`, `READ “CONNECTING THE DOTS”`, `READ “ANDROID GB”`, `READ “PUTTING A PRICE”`, `FINISHED CLEANING`, `ALICE GOES TO HER ROOM`, `REWASH CLOTHES`, `DISTURB TODD`, and `ENRAGE ALICE`. The image confirms these are visually separate boxes or branch labels; I did not resolve every arrow among them. No cross-chapter arrow to Todd's later meeting appears in this chapter screenshot. The later link remains the separately documented **unresolved D2 hypothesis**.

## Interaction implication

Use a spatial canvas with many connected boxes visible simultaneously. Pan and zoom preserve neighboring branches. Clicking a box may reveal conditions and sources in a side panel, but it must leave the map visible. The Steam images are chapter-specific screenshots, so the mockup must not fabricate a single continuous line connecting the independent D1 and D3 examples. Its *All samples* canvas shows D1, D2, and D3 as separate clusters. Only the D2 box-to-Todd hypothesis crosses chapters, as a dashed **UNRESOLVED** edge with the later prerequisites named. The D3 checkpoint detour remains a separate cluster.
