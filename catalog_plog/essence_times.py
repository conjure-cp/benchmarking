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
import re

import pandas as pd

import essence_collector


def build_command(config_path, limits, tmp_dir) -> list[str]:
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


def solve_problems(essence_dir, limits, output_dir):
    # Find all the problems
    config_paths = essence_dir.rglob("config.json")
    commands = []
    for config in config_paths:
        commands.extend(build_command(config, limits, output_dir))

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


def _parse_runsolver_values(values_path):
    values = {}
    if not values_path or not values_path.is_file():
        return values

    for line in values_path.read_text(errors="replace").splitlines():
        line = line.strip()
        if line and not line.startswith("#") and "=" in line:
            key, value = line.split("=", 1)
            values[key.strip()] = value.strip()
    return values


def _parse_stats(stats_path):
    if not stats_path or not stats_path.is_file():
        return None
    try:
        with stats_path.open() as f:
            stats = json.load(f)
    except (json.JSONDecodeError, OSError):
        return None
    return stats if isinstance(stats, dict) else None


def _problem_name(run_dir, stats):
    if stats:
        essence = stats.get("essence")
        if essence:
            return pathlib.Path(essence).name.removesuffix(".essence")

    match = re.fullmatch(r"(.+)\.\d+\.\d+", run_dir.name)
    return match.group(1) if match else run_dir.name


def _param_name(instance_dir, stats):
    if stats:
        params = stats.get("essenceParams")
        if params:
            return pathlib.Path(params[0]).name

    if instance_dir.name.endswith(".param"):
        return instance_dir.name
    return ""


def _boolean_value(values, key):
    return str(values.get(key, "false")).strip().lower() == "true"


def process_outputs(runs_dir, output_file):
    time_data = []
    instance_dirs = []

    for values_path in runs_dir.rglob("values.log"):
        instance_dirs.append(values_path.parent)

    for instance_dir in instance_dirs:
        relative = instance_dir.relative_to(runs_dir)
        if not relative.parts:
            continue

        run_dir = runs_dir / relative.parts[0]
        conjure_output = instance_dir / "conjure-output"
        stats_paths = list(conjure_output.glob("*.stats.json"))
        stats = _parse_stats(stats_paths[0]) if stats_paths else None

        values = _parse_runsolver_values(instance_dir / "values.log")
        timeout = _boolean_value(values, "TIMEOUT")
        memout = _boolean_value(values, "MEMOUT")

        row = {
            "name": _problem_name(run_dir, stats),
            "params": _param_name(instance_dir, stats),
        }

        if stats:
            status = stats.get("status", "")
            row["status"] = status
            if status == "TimeOut":
                timeout = True
            total_time = stats.get("totalTime")
            savilerow_info = stats.get("savilerowInfo", {})
            if not isinstance(savilerow_info, dict):
                savilerow_info = {}

            if total_time is None:
                total_time = savilerow_info.get("SavileRowTotalTime")
            if total_time is not None:
                row["total_time"] = total_time

            for key, value in savilerow_info.items():
                row[key] = value
        else:
            row["status"] = "MEMOUT" if memout else "TimeOut" if timeout else "ERROR"

        row["timeout"] = timeout
        row["memout"] = memout
        for key in ("WCTIME", "CPUTIME", "MAXVM", "MAXMM", "MAXRSS", "EXITSTATUS"):
            if key in values:
                row[key.lower()] = values[key]
        time_data.append(row)

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
        "OUTPUT_DIR", type=pathlib.Path, help="Directory for solver outputs"
    )
    solve_parser.add_argument(
        "limits", type=pathlib.Path, help="JSON resource limits for runsolver"
    )

    process_parser = subparsers.add_parser(
        "process", help="Convert runner temporary solver outputs into CSV"
    )
    process_parser.add_argument(
        "OUTPUT_DIR", type=pathlib.Path, help="Directory containing solver outputs"
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
