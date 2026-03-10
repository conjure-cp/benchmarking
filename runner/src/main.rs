use serde::{Deserialize, Serialize};
use serde_json::Error;
use serde_json::Value;
use std::env;
use std::fs;
use std::fs::FileType;
use std::path;
use std::path::Path;

#[derive(Serialize, Deserialize)]
struct Config {
    conjure_path: String,
    args: Vec<String>,
    problems_names: Vec<String>,
    negate: bool,
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
    let cfg = match cfg {
        Some(c) => c,
        None => {
            return;
        }
    };
    let problems = find_problems(problems);
}

fn validate_args(config: &String, problems: &String) -> bool {
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

fn read_config(config: &String) -> Option<Config> {
    let content = fs::read_to_string(config).unwrap_or_else(|_| "".to_string());

    let json: Result<Config, Error> = serde_json::from_str(&content[..]);
    match json {
        Ok(c) => {
            return Some(c);
        }
        Err(_) => {
            return None;
        }
    }
}

fn find_problems(dir: &String) -> Vec<String> {
    let mut out: Vec<String> = Vec::new();

    for entry in fs::read_dir(dir).unwrap() {
        if let Ok(e) = entry {
            let os_name = e.file_name();
            let name = os_name.to_str().unwrap_or_else(|| "");
            if &name[name.len() - 8..] == ".essence" {
                let p = e.path();
                let path = p.to_str().unwrap();
                let meta_path = path[..path.len() - 8].to_owned() + ".meta.json";
                if Path::new(&meta_path.to_owned()[..]).is_file() {
                    out.push(path.to_string());
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

fn run_benchmarks(problems: Vec<String>) -> Vec<Value> {}

fn build_output(results: Vec<Value>, location: String) {}
