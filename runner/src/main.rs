use chrono::DateTime;
use core::time;
use regex::Regex;
use serde::{Deserialize, Serialize};
use serde_json::Error;
use std::cmp::max;
use std::env;
use std::fs;
use std::fs::File;
use std::io::Write;
use std::ops::Sub;
use std::path::Path;
use std::process::Command;
use std::sync::Arc;
use std::sync::Mutex;
use std::sync::mpsc;
use std::thread;
use std::time::Duration;
use std::time::Instant;
use std::time::SystemTime;
use threadpool::ThreadPool;

#[derive(Serialize, Deserialize, Debug, Clone)]
struct Config {
    conjure_path: String,
    args: Vec<Vec<String>>,
    problem_names: Vec<String>,
    negate: bool,
    oxide: bool,
}

#[derive(Serialize, Deserialize, Debug)]
struct Configs {
    options: Vec<Config>,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
struct Meta {
    name: String,
    params: String,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
struct Problem {
    meta: Meta,
    path: String,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
struct Results {
    config: Config,
    results: Vec<BenchmarkResult>,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
struct BenchmarkResult {
    problem: Problem,
    total_time: f64,
    times: Vec<Section>,
    param_runs: Vec<ParamRun>,
    found_sols: bool,
    args: Vec<String>,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
struct ParamRun {
    name: String,
    total_time: f64,
    times: Vec<Section>,
    found_sols: bool,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
struct Section {
    name: String,
    time: f64,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
struct ConjureStats {
    computer: String,
    conjureVersion: String,
    essence: String,
    essenceParams: Vec<String>,
    runsolverInfo: RunsolverInfo,
    savilerowInfo: SavilerowInfo,
    savilerowLogs: SavilerowLogs,
    savilerowOptions: Vec<String>,
    savilerowVersion: String,
    solver: String,
    solverOptions: Vec<String>,
    status: String,
    timestamp: String,
    totalTime: f64,
    useExistingModels: Vec<String>,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
struct RunsolverInfo {}

#[derive(Serialize, Deserialize, Debug, Clone)]
struct SavilerowInfo {
    SavileRowClauseOut: String,
    SavileRowTimeOut: String,
    SavileRowTotalTime: String,
    SolverNodes: String,
    SolverSatisfiable: String,
    SolverSetupTime: String,
    SolverSolutionsFound: String,
    SolverSolveTime: String,
    SolverTimeOut: String,
    SolverTotalTime: String,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
struct SavilerowLogs {
    exitCode: i64,
    stdout: Vec<String>,
}

fn main() {
    let args: Vec<String> = env::args().collect();
    let default_output_file = String::from("out.json");

    if args.len() < 3 {
        println!("Expected useage: runner CONFIG.FILE PROBLEM.DIR [OUTPUT.FILE]");
        return;
    }

    let config = args.get(1).unwrap();
    let problems = args.get(2).unwrap();
    let output = args.get(3).unwrap_or(&default_output_file);

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

    let pool = ThreadPool::new(max(2, num_cpus::get() / 2));

    let problems = find_problems(problems);
    run_benchmarks(problems, configs, output, pool);
}

fn validate_args(config: &str, problems: &str) -> bool {
    if !Path::new(config).is_file() {
        println!("Cannot find provided config file");
        return false;
    }

    if !Path::new(problems).is_dir() {
        println!("Cannot find the provided problem file directory");
        return false;
    }

    true
}

fn read_config(config: &str) -> Option<Configs> {
    let content = fs::read_to_string(config).unwrap_or(String::new());

    let json: Result<Configs, Error> = serde_json::from_str(&content);
    json.ok()
}

fn find_problems(dir: &str) -> Vec<Problem> {
    let mut out: Vec<Problem> = Vec::new();

    for entry in fs::read_dir(dir).unwrap() {
        if let Ok(e) = entry {
            let os_name = e.file_name();
            let name = os_name.to_str().unwrap_or("");
            if name.ends_with(".essence") {
                let p = e.path();
                let path = p.to_str().unwrap();
                let meta_path = path[..path.len() - 8].to_owned() + ".meta.json";
                if Path::new(&meta_path).is_file() {
                    let meta = fs::read_to_string(meta_path).unwrap_or(String::new());
                    if let Ok(meta) = serde_json::from_str(&meta) {
                        out.push(Problem {
                            meta: meta,
                            path: path.to_string(),
                        });
                    }
                }
            }

            if let Ok(ft) = e.file_type()
                && ft.is_dir()
            {
                out.append(&mut find_problems(e.path().to_str().unwrap()))
            }
        }
    }

    out
}

fn run_benchmarks(problems: Vec<Problem>, configs: Configs, output_file: &str, pool: ThreadPool) {
    let out: Arc<Mutex<Vec<Results>>> = Arc::new(Mutex::new(Vec::new()));

    let write_cp = Arc::clone(&out);
    let output_file = output_file.to_owned();
    let (tx, rx) = mpsc::channel::<bool>();
    let handle = thread::spawn(move || {
        loop {
            let mut should_end = false;
            if let Ok(_) = rx.try_recv() {
                should_end = true;
            }

            build_output(write_cp.lock().unwrap().clone(), &output_file);
            if should_end {
                break;
            } else {
                thread::sleep(time::Duration::from_secs(3));
            }
        }
    });

    for c in configs.options {
        let out = Arc::clone(&out);
        run_all(&problems, c, out, &pool);
    }

    pool.join();
    let _ = tx.send(true);
    let _ = handle.join();
}

fn run_all(
    problems: &Vec<Problem>,
    config: Config,
    out: Arc<Mutex<Vec<Results>>>,
    pool: &ThreadPool,
) {
    let idx;
    {
        let mut out = out.lock().unwrap();
        out.push(Results {
            config: config.clone(),
            results: Vec::new(),
        });
        idx = out.len() - 1;
    }

    for args in &config.args {
        let command = format!("{} {}", config.conjure_path, args.join(" "));

        for p in problems {
            if (!config.negate && !config.problem_names.contains(&p.meta.name))
                || (config.negate && config.problem_names.contains(&p.meta.name))
            {
                continue;
            }

            let p = p.clone();
            let command = command.clone();
            let out = Arc::clone(&out);

            let re = Regex::new("[^/]*$").unwrap();
            if p.meta.params != "" {
                let param_path = re.replace(&p.path, p.meta.params.clone());
                let p_idx;
                {
                    let mut out = out.lock().unwrap();
                    let r: &mut Results = out.get_mut(idx).unwrap();
                    r.results.push(BenchmarkResult {
                        problem: p.clone(),
                        total_time: -1.0,
                        times: Vec::new(),
                        param_runs: Vec::new(),
                        found_sols: true,
                        args: args.clone(),
                    });
                    p_idx = r.results.len() - 1;
                }
                for entry in fs::read_dir(param_path.as_ref()).unwrap() {
                    let out = Arc::clone(&out);
                    if let Ok(e) = entry {
                        let path = e.path();
                        let path = path.to_str().unwrap().to_string();
                        let com = command.clone();
                        let prob = p.clone();
                        pool.execute(move || {
                            if let Some(res) = run_one_problem(&prob, com, config.oxide, path) {
                                let mut out = out.lock().unwrap();
                                let r: &mut Results = out.get_mut(idx).unwrap();
                                let b: &mut BenchmarkResult = r.results.get_mut(p_idx).unwrap();
                                b.param_runs.push(ParamRun {
                                    name: e.file_name().to_str().unwrap().to_string(),
                                    total_time: res.total_time,
                                    times: res.times,
                                    found_sols: res.found_sols,
                                });
                            }
                        });
                    }
                }

                // Squash into one result with all the different params
            } else {
                let c_args = args.clone();
                pool.execute(move || {
                    if let Some(res) = run_one_problem(&p, command, config.oxide, "".to_string()) {
                        let mut out = out.lock().unwrap();
                        let r: &mut Results = out.get_mut(idx).unwrap();
                        r.results.push(BenchmarkResult {
                            args: c_args,
                            ..res
                        });
                    }
                });
            }
        }
    }
}

// Change this to have param file
fn run_one_problem(
    problem: &Problem,
    command: String,
    oxide: bool,
    param: String,
) -> Option<BenchmarkResult> {
    let mut cmd = Command::new("bash");
    let start = SystemTime::now();
    let temp = format!(
        "{}-{}",
        problem.meta.name,
        start
            .duration_since(SystemTime::UNIX_EPOCH)
            .unwrap_or(Duration::new(0, 0))
            .as_secs_f64()
    );
    if let Err(_) = fs::create_dir(&temp) {
        return None;
    }

    let mut extra_opts = "";
    if oxide {
        extra_opts = "--log --logfile conjure-oxide.log"
    }

    let mut param_path = String::new();
    if param != "" {
        param_path = "../".to_string() + &param;
    }

    let start = Instant::now();

    let output = cmd
        .arg("-c")
        .arg(format!(
            "cd {}; {} {} ../{} {}",
            temp, command, extra_opts, problem.path, param_path
        ))
        .output();
    let elapsed = start.elapsed();
    let mut times: Vec<Section> = Vec::new();

    println!("Finished - {}", problem.path);

    let mut solved = false;

    if oxide {
        let log_file =
            fs::read_to_string(format!("{}/conjure-oxide.log", temp)).unwrap_or(String::new());

        let mut last_stamp = Ok(DateTime::from_timestamp_nanos(0).fixed_offset());
        for line in log_file.split("\n") {
            if line.contains("INFO") {
                let segs = line.split(" ").collect::<Vec<&str>>();
                let time_stamp = segs.get(0).unwrap();
                let time_stamp = DateTime::parse_from_rfc3339(time_stamp);
                if line.contains("Rewriting") {
                    last_stamp = time_stamp.clone();
                }

                if line.contains("Rewritten") {
                    times.push(Section {
                        name: "Rewriting".to_string(),
                        time: time_stamp
                            .unwrap()
                            .sub(last_stamp.unwrap())
                            .as_seconds_f64(),
                    });
                    last_stamp = time_stamp.clone();
                }

                if line.contains("Solutions") {
                    solved = true;
                    times.push(Section {
                        name: "Solver".to_string(),
                        time: time_stamp
                            .unwrap()
                            .sub(last_stamp.unwrap())
                            .as_seconds_f64(),
                    });
                }
            }
        }
    } else {
        for entry in fs::read_dir(format!("{}/conjure-output", temp)).unwrap() {
            if entry
                .as_ref()
                .unwrap()
                .file_name()
                .to_str()
                .unwrap()
                .contains(".json")
            {
                let stats = fs::read_to_string(entry.unwrap().path()).unwrap();
                let stats: Result<ConjureStats, Error> = serde_json::from_str(&stats);
                if stats
                    .as_ref()
                    .unwrap()
                    .savilerowInfo
                    .SolverSolutionsFound
                    .parse::<i64>()
                    .unwrap()
                    > 0
                {
                    solved = true;
                }
                times.push(Section {
                    name: "Savile Row".to_string(),
                    time: stats
                        .as_ref()
                        .unwrap()
                        .savilerowInfo
                        .SavileRowTotalTime
                        .parse()
                        .unwrap(),
                });
                times.push(Section {
                    name: "Solver".to_string(),
                    time: stats
                        .unwrap()
                        .savilerowInfo
                        .SolverTotalTime
                        .parse()
                        .unwrap(),
                });
                break;
            }
        }
    }

    let _ = fs::remove_dir_all(temp);

    return match output {
        Ok(_) => Some(BenchmarkResult {
            problem: problem.clone(),
            times: times,
            total_time: elapsed.as_secs_f64(),
            param_runs: Vec::new(),
            found_sols: solved,
            args: Vec::new(),
        }),
        Err(_) => None,
    };
}

fn build_output(results: Vec<Results>, location: &str) {
    let json = serde_json::to_string(&results).expect("FATAL ERROR");

    let out_file = File::create(location);
    if let Ok(mut file) = out_file {
        let res = file.write_all(json.as_bytes());
        if let Err(e) = res {
            println!("{e}")
        }
    } else {
        println!("Could not write to output file")
    }
}
