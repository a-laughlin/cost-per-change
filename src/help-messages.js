export const ABOUT_HELP = ``+
`This is the about message, which needs content.


There are definitely some quirks:

Clicking links doesn't work.

Recalculating metrics requires updating the url (cut/paste works fine).
Typing in the url doesn't work, for some reason.

Rule impacts need some thought to be more useful.
Maybe comparing across repos.

Show the code and/or more detailed metrics (probably in an iframe when files clicked).
^ not sure if more details are actually valuable.
Chances are you already know what's in the files (if they're your own).

For more on metrics, see:
https://github.com/escomplex/escomplex/blob/master/METRICS.md
`;
export const REPO_URL_HELP = `
  Paste a repo path into this field.  The rest of the repo fields will recalculate from the
  js/jsx/ts files in that repo.

  You can copy and remove repos to compare them (buttons on the right);

  Note, an auth token is required for the API request.  See the "Github Token" help.
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
