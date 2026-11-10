# Requirements
# Gnu Parallel
# runsolver on path
# runner in the same directory
# conjure-oxide on path
# Already existing SRC_DIR, DEST_DIR, and runner_temp dir (for the runner)

import argparse
import json
import pathlib
import subprocess

import pandas as pd

import essence_collector

parser = argparse.ArgumentParser()
parser.add_argument("SRC_DIR", type=pathlib.Path, help="Path to src of .essence files")
parser.add_argument("DEST_DIR", type=pathlib.Path, help="Path of dir to dump essence, params, and configs")
parser.add_argument("OUTPUT_DIR", type=pathlib.Path, help="Path of dir for solver runner outputs")
parser.add_argument("OUTPUT_FILE", type=pathlib.Path, help="Single output file with all problem times")
parser.add_argument("config", type=pathlib.Path, help="JSON config file for runner")
parser.add_argument("limits", type=pathlib.Path, help="JSON of resource limits for runsolver")
parser.add_argument("--clobber", action="store_true", help="Overwrite contents of DEST_DIR")
parser.add_argument("--skip-collect", action="store_true", help="Skip essence collection stage, skip to timed solving")

args = parser.parse_args()

with args.config.open() as f:
    config = json.load(f)

with args.limits.open() as f:
    limits = json.load(f)

if not args.SRC_DIR.is_dir():
    print("SRC_DIR is not a directory")
    exit()

if not args.DEST_DIR.is_dir():
    print("DEST_DIR is not a directory")
    exit()

if not args.skip_collect and not args.clobber and any(args.DEST_DIR.iterdir()):
    print("DEST_DIR already has stuff in it. If you are sure pass --clobber")
    exit()

if not args.skip_collect:
    print(
        f"Collecting essence files from {args.SRC_DIR} and dumping to {args.DEST_DIR} with config"
    )
    essence_collector.collect(args.SRC_DIR, args.DEST_DIR, config)


def solve_problems(essence_dir, limits, output_dir):
    # Build up the command
    cmd = f'find {essence_dir} -name "config.json" | parallel -j 75% runsolver --timestamp -w watch.log -v values.log -o tool_output.log '

    for k, v in limits.items():
        cmd += f"{k} {v} "

    cmd += f" ./runner {{}} {{//}} {output_dir}/'{{= $_=(split \"/\", $_)[-2] =}}'_out.json"

    subprocess.run(cmd, shell=True)


solve_problems(args.DEST_DIR, limits, args.OUTPUT_DIR)


def process_outputs(outputs_dir, output_file):
    time_data = []
    for file in outputs_dir.iterdir():
        with file.open() as f:
            output = json.load(f)

    for config in output:
        for result in config["results"]:
            if result["times"]:
                d = {"name": result["problem"]["meta"]["name"],"oxide": config["config"]["oxide"], "total_time": result["total_time"]}
                for time in result["times"]:
                    d[time["name"]] = time["time"]

                d["args"] = " ".join(result["args"])

                time_data.append(d)
            else:
                param_runs = result["param_runs"]
                for run in param_runs:
                    d = {"name": result["problem"]["meta"]["name"], "params": run["name"], "total_time": run["total_time"]}
                    for time in run["times"]:
                        if time["name"].startswith("Replaced"):
                            continue

                        d[time["name"]] = time["time"]

                    d["args"] = " ".join(result["args"])

                    time_data.append(d)

    df = pd.DataFrame(time_data)
    df.to_csv(output_file, index=False)

process_outputs(args.OUTPUT_DIR, args.OUTPUT_FILE)
