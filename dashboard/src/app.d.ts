// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
    type Results = {
        config: Config
        results: Result[]
    }[];

    type Config = {
        conjure_path: string,
        args: string[][]
        problem_names: string[]
        negate: boolean,
        oxide: boolean,
    }

    type Result = {
        found_sols: boolean,
        param_runs: {
            name: string,
            total_time: number,
            times: TimeSegment[],
            found_sols: boolean,
        }[],
        problem: {
            meta: {
                name: string,
                params: string,
            },
            path: string,
        },
        times: TimeSegment[],
        args: string[],
        total_time: number

    }

    type FilterValues = {
        pr: string;
        solvers: string[];
        args: string[];
    }

    type TimeSegment = {
        name: string,
        time: number
    }

    namespace App {
        // interface Error { }
        // interface Locals {}
        // interface PageData {}
        // interface PageState {}
        // interface Platform {}
    }
}



export { };
