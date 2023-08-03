# Performance Optimization of `edict`

The (aspirational) performance goals of `edict` is to be a
reasonable choice of logic management for browser games targeting
60 frames-per-second. 

The measure of the success of this goal is compare `edict`'s performance
to popular ECS libraries like [bitecs](https://github.com/NateTheGreatt/bitECS) with the
goal of being _within one order of magnitude_ of these libraries.

Essentially, `edict` does not need to be the fastest library, but it should at least
be an acceptable choice (instead of a total non-starter).

## Testing Performance
The [perf.spec.ts](../src/lib/perf.spec.ts) file has several tests based on this
[benchmark repo](https://github.com/noctjs/ecs-benchmark). Ideally `edict` can eventually be
a reasonable entry on its table. As of Dec 28, 2022 that is not true. Having `edict` on those tables
would be ridiculous.

Each jest test corresponds to a benchmark test in that repo, with `expect` lines representing different milestones
to achieve. 

## Setup
Since `edict` is OSS, we have the great priviledge to be able to use [Wallaby.js](https://wallabyjs.com/) free of charge! This is super helpful
because we can use their `Profile Test` feature to generate performance visualizations (flame graphs, call trees, etc) to find the bottlenecks to improve.

Follow their install instructions [here](https://wallabyjs.com/docs/intro/install.html) to get started, and we use the [CPU Profiling](https://wallabyjs.com/docs/intro/test-profiler.html) often!
