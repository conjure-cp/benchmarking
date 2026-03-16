use serde::{Deserialize, Serialize};
use serde_json::Error;
use std::env;
use std::fs;
use std::fs::File;
use std::io::Write;
use std::path::Path;

#[derive(Serialize, Deserialize, Debug)]
struct Config {
    conjure_path: String,
    args: Vec<Vec<String>>,
    problem_names: Vec<String>,
    negate: bool,
}

#[derive(Serialize, Deserialize, Debug)]
struct Configs {
    options: Vec<Config>,
}

#[derive(Serialize, Deserialize, Debug)]
struct Problem {
    name: String,
}

#[derive(Serialize, Deserialize, Debug)]
struct Results {
    config: Config,
    results: Vec<BenchmarkResult>,
}

#[derive(Serialize, Deserialize, Debug)]
struct BenchmarkResult {
    problem: Problem,
    total_time: f64,
    times: Vec<Section>,
}

#[derive(Serialize, Deserialize, Debug)]
struct Section {
    name: String,
    time: f64,
}

fn main() {
    let args: Vec<String> = env::args().collect();
    let default_output_file: String = String::from("out.json");

    if args.len() < 3 {
        println!("Expected useage: runner CONFIG.FILE PROBLEM.DIR [OUTPUT.FILE]");
        return;
    }

    let config = args.get(1).unwrap();
    let problems = args.get(2).unwrap();
    let output = args.get(3).unwrap_or_else(|| &default_output_file);

    if !validate_args(config, problems) {
        return;
    }

    let cfg = read_config(config);
    let configs = match cfg {
        Some(c) => c,
        None => {
            println!("Could not parse config file");
            return;
        }
    };
    let problems = find_problems(problems);
    let results = run_benchmarks(problems, configs);
    build_output(results, output);
}

fn validate_args(config: &str, problems: &str) -> bool {
    if !Path::new(&config.to_owned()[..]).is_file() {
        println!("Cannot find provided config file");
        return false;
    }

    if !Path::new(&problems.to_owned()[..]).is_dir() {
        println!("Cannot find the provided problem file directory");
        return false;
    }

    true
}

fn read_config(config: &str) -> Option<Configs> {
    let content = fs::read_to_string(config).unwrap_or_else(|_| "".to_string());

    let json: Result<Configs, Error> = serde_json::from_str(&content[..]);
    match json {
        Ok(c) => {
            return Some(c);
        }
        Err(_) => {
            return None;
        }
    }
}

fn find_problems(dir: &str) -> Vec<Problem> {
    let mut out: Vec<Problem> = Vec::new();

    for entry in fs::read_dir(dir).unwrap() {
        if let Ok(e) = entry {
            let os_name = e.file_name();
            let name = os_name.to_str().unwrap_or_else(|| "");
            if name.len() > 8 && &name[name.len() - 8..] == ".essence" {
                let p = e.path();
                let path = p.to_str().unwrap();
                let meta_path = path[..path.len() - 8].to_owned() + ".meta.json";
                if Path::new(&meta_path.to_owned()[..]).is_file() {
                    let meta = fs::read_to_string(meta_path).unwrap_or_else(|_| "".to_string());
                    if let Ok(problem) = serde_json::from_str(&meta[..]) {
                        out.push(problem);
                    }
                }
            }

            if let Ok(ft) = e.file_type()
                && ft.is_dir()
            {
                out.append(&mut find_problems(&e.path().to_str().unwrap().to_string()))
            }
        }
    }

    out
}

fn run_benchmarks(problems: Vec<Problem>, configs: Configs) -> Vec<Results> {
    let mut out: Vec<Results> = Vec::new();
    for c in configs.options {
        out.push(run_all(&problems, c));
    }
    out
}

fn run_all(problems: &Vec<Problem>, config: Config) -> Results {
    let mut commands: Vec<String> = Vec::new();
    for args in &config.args[..] {
        commands.push(config.conjure_path.clone() + " " + &args.join(" "));
    }

    Results {
        config,
        results: Vec::new(),
    }
}

fn build_output(results: Vec<Results>, location: &str) {
    let json = serde_json::to_string(&results).expect("FATAL ERROR");

    let out_file = File::create(location);
    if let Ok(mut file) = out_file {
        let res = file.write_all(json.as_bytes());
        if let Err(e) = res {
            println!("{}", e)
        }
    } else {
        println!("Could not write to output file")
    }
}
