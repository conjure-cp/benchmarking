// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
    type Result = {
        totalTime: number,
        conjure: number,
        savilleRow: number,
        solver: number,
        metadata: {
            oxide: boolean,
            solver: string,
            pr: string,
            args: string[],
            name: string,
            tags: string[]
        }
    };

    type FilterValues = {
        pr: string;
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
