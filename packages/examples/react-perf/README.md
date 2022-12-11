# React perf baseline with `edict`
The goal of this app is to illustrate the usage and performance
characteristics of an application with deeply related rules.

Specifically, given a big batch of raw data (the 'citizens') derive
the attributes of their cities and locations. 

The UI doesn't display everything that's going on, it's mostly an engine
for data generation and observation. 

The main value for you, the reader, is to look at the rules
in this file [here](src/app/rules/rules.ts) to see examples
of non-trivial rules and the leverage gained from derived facts. 

# Running the app
From the root, run `npm run examples:cities`
