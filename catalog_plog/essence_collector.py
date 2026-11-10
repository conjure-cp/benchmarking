import json
import pathlib

SRC_DIR = pathlib.Path("/home/etl1/EssenceCatalog/problems")
DEST_DIR = pathlib.Path("collected_essence/")


def collect(src, dest, config):
    count = 1
    for problem_file in src.rglob("*.essence"):
        # Possibly params
        params = list(problem_file.parent.rglob("*.param"))

        problem_dest_dir = dest / (problem_file.parent.name + f"_{count}")
        problem_dest_dir.mkdir(exist_ok=True)

        # Copy stuff into the destination directory

        # e.g. int_order_model.42.essence
        new_problem_name = (
            problem_file.parent.name
            + "_"
            + problem_file.with_suffix(f".{count}.essence").name
        )
        problem_file.copy(problem_dest_dir / new_problem_name)

        if params:
            param_dir = problem_dest_dir / (
                problem_file.parent.name + f".{count}_params"
            )
            param_dir.mkdir(exist_ok=True)
            for param in params:
                param.copy_into(param_dir)

        meta = {
            "name": new_problem_name[:-8],
            "params": param_dir.name if params else "",
        }
        meta_file = problem_dest_dir / (new_problem_name[:-8] + ".meta.json")
        with meta_file.open("w") as f:
            json.dump(meta, f)

        for i in range(len(config["options"])):
            config["options"][i]["problem_names"] = [new_problem_name[:-8]]

        config_file = problem_dest_dir / "config.json"
        with config_file.open("w") as f:
            json.dump(config, f)

        count += 1


if __name__ == "__main__":
    config = {
        "options": [
            {
                "conjure_path": "conjure-oxide",
                "args": [["solve", "-h", "f"], ["solve", "-h", "c"]],
                "problem_names": None,  # Will be populated for each one
                "negate": False,
                "oxide": True,
            }
        ]
    }

    collect(SRC_DIR, DEST_DIR, config)
