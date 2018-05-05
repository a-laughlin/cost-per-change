export const ABOUT_HELP = ``+
`Some code patterns cost more to maintain than others. Quantifying them can be complex and time-consuming. This app helps software
developers and managers quantify costs in any JavaScript Github repo visible to them.

For early description and mockups, see:
https://github.com/a-laughlin/cost-per-change/blob/master/src/description-and-mockups.pdf

Metrics:
Project uses escomplex for metrics. (https://github.com/escomplex/escomplex/)
I tried making the implementation more pluggable and granular with eslint,
but eslint is tightly coupled to the file system.

Implementation Quirks:
- Clicking links in the modal doesn't work yet.
- Recalculating metrics requires updating the url.
- Cut/pasting the url works fine, but typing doesn't. Oddly.
- Clicking the files does nothing.

Additional Thoughts:
- Rule impacts need some thought to be more useful.
  Maybe comparing across repos?
- Show the code and/or more detailed metrics (probably in an iframe when files clicked).
  ^ Unsure how valuable more details are in practice. Feedback welcome.

Code:
- Escomplex (Code Complexity Metrics)
- Lodash/FP
- React (experimenting with string components + hocs)
- Recompose (awesome HOCs)
- Many custom HOCs for FP mojo
- Babel standalone (for jsx, typescript, and to satisfy escomplex's limited palate)
- D3 (for the tree and colors)
- Styletron (translating inline styles to a stylesheet)
`;


export const REPO_URL_HELP = `
  Paste a repo directory path into this field.
  The rest of the repo fields will recalculate
  from the js/jsx/ts files in that repo.

  Things to be aware of:
  1. An auth token is required for the API request.  See the "Github Token" help.
  2. You can copy and remove repos to compare them (buttons on the right);
  3. Some repo directories don't work. I spent a lot of time trying to find ways
      to make as many as possible work. If you find one that doesn't, you're
      welcome to submit a PR. The relevant code is at:
      https://github.com/a-laughlin/cost-per-change/blob/master/src/code-analysis.js#L32
`;

export const TIME_PER_CHANGE_HELP = ``+
`An estimate of how long it takes to implement a change
in this repo, from concept to live production code.

Deployment processes vary from repo to repo.
Set this for greater accuracy on repos with known deployment processes/times.

Note, you'll need to reload the url for the table to recalculate currently.
(cut/paste works fine)
`;

export const CYCLOMATIC_HELP = ``+
`Cyclomatic Complexity
Defined by Thomas J. McCabe in 1976, this is a count of the number of cycles in the program flow control graph. Effectively the number of distinct paths through a block of code. Lower is better.
`
export const MAINTAINABILITY_HELP = ``+
`Maintainability
Defined by Paul Oman & Jack Hagemeister in 1991, this is a logarithmic scale from negative infinity to 171, calculated from the logical lines of code, the cyclomatix complexity and the Halstead effort. Higher is better.
`;
export const EFFORT_HELP = ``+
`Halstead effort
see http://wikipedia.org/wiki/Halstead_complexity_measures
`;
