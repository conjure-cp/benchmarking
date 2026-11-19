# Requirements
# Gnu Parallel
# runsolver on path
# runner in the same directory
# conjure-oxide on path
# Already existing SRC_DIR, DEST_DIR, and runner_temp dir (for the runner)

import argparse
import json
import time
import pathlib
import random
import subprocess
import tempfile

import pandas as pd

import essence_collector


def build_command(config_path, limits, output_dir, tmp_dir) -> list[str]:
    try:
        with config_path.open() as fp:
            config_json = json.load(fp)
    except:
        print("Couldn't load json for {config_path}")
        exit()

    commands = []
    for config in config_json["options"]:
        for args in config["args"]:
            run_temp = tmp_dir / (config["problem_names"][0] + str(time.time()))
            run_temp.mkdir()
            essence_path = config_path.parent / (
                config["problem_names"][0] + ".essence"
            )

            meta_path = config_path.parent / (config["problem_names"][0] + ".meta.json")
            with meta_path.open() as fp:
                meta_json = json.load(fp)

            if meta_json["params"] == "":
                commands.append(
                    f"cd {run_temp.resolve()}; runsolver -w watch.log -v values.log -o tool_output.log {" ".join(f"{k} {v}" for k, v in limits.items())} {config["conjure_path"]} {" ".join(args)}{" --stats stats.json" if config["oxide"] else ""} {essence_path.resolve()}"
                )
            else:
                params_dir_path = config_path.parent / meta_json["params"]
                for param in params_dir_path.glob("*.param"):
                    param_run_temp = run_temp / param.name
                    param_run_temp.mkdir()
                    commands.append(
                        f"cd {param_run_temp.resolve()}; runsolver -w watch.log -v values.log -o tool_output.log {" ".join(f"{k} {v}" for k, v in limits.items())} {config["conjure_path"]} {" ".join(args)}{" --stats stats.json" if config["oxide"] else ""} {essence_path.resolve()} {param.resolve()}"
                    )

    return commands


def solve_problems(essence_dir, limits, output_dir, tmp_dir):
    # Find all the problems
    config_paths = essence_dir.rglob("config.json")
    commands = []
    for config in config_paths:
        commands.extend(build_command(config, limits, output_dir, tmp_dir))

    with tempfile.NamedTemporaryFile(mode="w", delete=False) as fp:
        print(fp.name)
        random.shuffle(commands)
        fp.write("\n".join(commands))

        # Run them all
        cmd = [
            "parallel",
            "--eta",
            "-j",
            "0",
            "--memfree",
            "50G",
            #"--delay",
            #"1sauto",
            "--joblog",
            "essence_times_parallel.log",
            "::::",
            fp.name,
        ]
        print(" ".join(cmd))
        subprocess.run(cmd)


def process_outputs(outputs_dir, output_file):
    time_data = []
    for file in outputs_dir.iterdir():
        if not file.is_file() or file.suffix != ".json":
            continue
        with file.open() as f:
            output = json.load(f)

        for config in output:
            for result in config["results"]:
                if result["times"]:
                    d = {
                        "name": result["problem"]["meta"]["name"],
                        "oxide": config["config"]["oxide"],
                        "total_time": result["total_time"],
                    }
                    for time in result["times"]:
                        d[time["name"]] = time["time"]

                    d["args"] = " ".join(result["args"])

                    time_data.append(d)
                else:
                    param_runs = result["param_runs"]
                    for run in param_runs:
                        d = {
                            "name": result["problem"]["meta"]["name"],
                            "params": run["name"],
                            "total_time": run["total_time"],
                        }
                        for time in run["times"]:
                            if time["name"].startswith("Replaced"):
                                continue

                            d[time["name"]] = time["time"]

                        d["args"] = " ".join(result["args"])

                        time_data.append(d)

    df = pd.DataFrame(time_data)
    df.to_csv(output_file, index=False)


def build_parser():
    parser = argparse.ArgumentParser(
        description="Collect Essence problems, solve them, or process solver outputs."
    )
    subparsers = parser.add_subparsers(dest="command", required=True)

    collect_parser = subparsers.add_parser(
        "collect", help="Collect Essence files and generate solver configurations"
    )
    collect_parser.add_argument(
        "SRC_DIR", type=pathlib.Path, help="Path to source .essence files"
    )
    collect_parser.add_argument(
        "DEST_DIR", type=pathlib.Path, help="Directory in which to collect files"
    )
    collect_parser.add_argument("config", type=pathlib.Path, help="JSON collector config")
    collect_parser.add_argument(
        "--clobber", action="store_true", help="Allow DEST_DIR to already contain files"
    )

    solve_parser = subparsers.add_parser(
        "solve", help="Solve collected Essence problems"
    )
    solve_parser.add_argument(
        "DEST_DIR", type=pathlib.Path, help="Directory containing collected files"
    )
    solve_parser.add_argument(
        "OUTPUT_DIR", type=pathlib.Path, help="Directory for solver JSON outputs"
    )
    solve_parser.add_argument(
        "limits", type=pathlib.Path, help="JSON resource limits for runsolver"
    )
    solve_parser.add_argument(
        "tmp_dir", type=pathlib.Path, help="Directory for temporary solver logs"
    )

    process_parser = subparsers.add_parser(
        "process", help="Convert solver output JSON files into CSV"
    )
    process_parser.add_argument(
        "OUTPUT_DIR", type=pathlib.Path, help="Directory containing solver JSON outputs"
    )
    process_parser.add_argument(
        "OUTPUT_FILE", type=pathlib.Path, help="CSV file to write"
    )

    return parser


def collect_problems(args):
    if not args.SRC_DIR.is_dir():
        parser.error(f"SRC_DIR is not a directory: {args.SRC_DIR}")
    if not args.config.is_file():
        parser.error(f"config is not a file: {args.config}")

    args.DEST_DIR.mkdir(parents=True, exist_ok=True)
    if not args.clobber and any(args.DEST_DIR.iterdir()):
        parser.error(
            f"DEST_DIR already has stuff in it: {args.DEST_DIR}. "
            "If you are sure, pass --clobber"
        )

    with args.config.open() as f:
        config = json.load(f)

    print(
        f"Collecting essence files from {args.SRC_DIR} and dumping to "
        f"{args.DEST_DIR} with config"
    )
    essence_collector.collect(args.SRC_DIR, args.DEST_DIR, config)


def solve(args):
    if not args.DEST_DIR.is_dir():
        parser.error(f"DEST_DIR is not a directory: {args.DEST_DIR}")
    args.OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    if not args.limits.is_file():
        parser.error(f"limits is not a file: {args.limits}")

    args.tmp_dir.mkdir(parents=True, exist_ok=True)
    with args.limits.open() as f:
        limits = json.load(f)

    solve_problems(args.DEST_DIR, limits, args.OUTPUT_DIR, args.tmp_dir)


def process(args):
    if not args.OUTPUT_DIR.is_dir():
        parser.error(f"OUTPUT_DIR is not a directory: {args.OUTPUT_DIR}")

    args.OUTPUT_FILE.parent.mkdir(parents=True, exist_ok=True)
    process_outputs(args.OUTPUT_DIR, args.OUTPUT_FILE)


if __name__ == "__main__":
    parser = build_parser()
    args = parser.parse_args()

    if args.command == "collect":
        collect_problems(args)
    elif args.command == "solve":
        solve(args)
    elif args.command == "process":
        process(args)
