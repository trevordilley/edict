# Profiling Edict
Describes how to generate and use cpu profiles

## Making Profiles
The `perf.spec.ts` test will generate cpu profiles on each run

## Reading the profiles
You can either drag/drop these profiles onto http://speedscope.app or 
install the `speedscope` cli tool (`npm i -g speedscope`) and then run it like
so: `speedscope path/to/profile`

More info on `speedscope` [here](https://github.com/jlfwong/speedscope)
