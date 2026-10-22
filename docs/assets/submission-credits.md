# Asset credits and source notes

- Product footage: actual SuryaLedger local app, recorded in Chrome 153 with Puppeteer. All displayed sites, technician names and submitted reports are synthetic demonstration data. The JSON inspection shows data emitted by the app's export Blob.
- Source code: [SuryaLedger](https://github.com/Pradhyut21/suryaledger).
- Narration: Kokoro-82M `am_michael`, generated locally through HyperFrames at speed 1.08. [Kokoro model card](https://huggingface.co/hexgrad/Kokoro-82M), [local ONNX implementation](https://github.com/thewh1teagle/kokoro-onnx). This is an explanatory synthetic narrator, not recorded call audio or a cloned person.
- Fonts: DM Sans and Manrope, shipped locally from the app's Fontsource packages.
- Animation runtime: GSAP 3.14.2, shipped locally. [GSAP](https://gsap.com/).
- Music and sound effects: none. The main demonstration prioritizes narration clarity.

The generic HyperFrames URL-capture command returned HTTP403 for the loopback URL. Its partial artifacts were not used. The original brief supplied the app source; direct local-browser recordings provide the main film's product assets. Capture provenance is retained in the editable project catalog and `capture-timing.json`.
