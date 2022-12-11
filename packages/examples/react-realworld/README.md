# Conduit in `edict`

## Acknowledgements
I'm super grateful for the high quality implementation of Conduit done by [angelguzmaning](https://github.com/angelguzmaning/ts-redux-react-realworld-example-app).

This example copy/pasted his implementation, then set about removing redux and adding `edict`. Their implementation
was by far the most complete and easiest to work with, and if I hadn't found this implementation I likely wouldn't have 
been able to provide a fully-realized implementation of Conduit using `edict` in a suitable timeframe! Please go give 
their work some stars! 

## Goal 
The aim of this example was definitely "Can I write a full app in `edict`?" and
definitely not _"Here's how to write an app in `edict`"_

I call this out because this was example was not written from scratch with `edict`, but rather 
had `redux` gutted from the source and `edict` introduced into an existing app, which
naturally means there will be areas where the fit doesn't seem appropriate. 

## Future of this example
As I iterate on making `edict`'s api more type-safe, and adding new debugging and profiling capabilities,
I intend to further improve this application's test-coverage and refine the organization of `edict` further. 

# Running the project
From the root, run `npm run examples:realworld`
