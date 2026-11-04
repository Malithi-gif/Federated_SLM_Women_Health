# Federated Small Language Models for Personalized and Interpretable Women's Health Support

Project page for the paper **"Federated Small Language Models for Personalized and Interpretable Women's Health Support."**

The site is plain HTML/CSS/JS with no build step, so GitHub Pages can serve it as is.

```
docs/
├── index.html            # the page
├── paper.pdf             # manuscript linked from the "Paper (PDF)" button
├── assets/
│   ├── css/style.css
│   ├── js/main.js        # dark mode, significance chart, example filters, BibTeX copy
│   └── img/              # figures extracted from the paper
└── .nojekyll             # tells GitHub Pages to skip Jekyll processing
```

## Deploy on GitHub Pages (from the `docs/` folder)

The site lives in `docs/` so it stays separate from the experiment outputs in the repository root.

1. Copy this `docs/` folder into the root of `Malithi-gif/Federated_SLM_Women_Health` and push:
   ```bash
   git clone https://github.com/Malithi-gif/Federated_SLM_Women_Health.git
   cd Federated_SLM_Women_Health
   # copy the docs/ folder here, then:
   git add docs
   git commit -m "Add project page"
   git push
   ```
   Or on github.com: **Add file → Upload files**, and drag the whole `docs` folder in.
2. Open **Settings → Pages**. Under **Build and deployment**, set **Source** to *Deploy from a branch*, choose **main** and **/docs**, then click **Save**.
3. After a minute or two the site is live at `https://malithi-gif.github.io/Federated_SLM_Women_Health/`.

## Before you publish: things to fill in

Search `index.html` for `TODO`:

- **Authors and affiliations** (hero section). They're shown as "Anonymous Authors" because the manuscript is anonymized.
- **BibTeX** (citation section): authors, journal and year after acceptance.
- **Code button**: once the code is public, replace the `<span class="btn btn-disabled">…</span>` with a link such as
  `<a class="btn" href="https://github.com/<you>/<code-repo>">…Code</a>`.
- **`og:url` / social image**: after deployment, you can set absolute URLs in the `<meta property="og:…">` tags so link previews show the figure.

## Local preview

```bash
python3 -m http.server 8000
# open http://localhost:8000
```

## Notes

- The mcPHASES dataset is on PhysioNet under restricted access ([doi:10.13026/zx6a-2c81](https://doi.org/10.13026/zx6a-2c81)) and is **not** included here.
- Generated feedback shown on the page is research output and isn't medical advice.
