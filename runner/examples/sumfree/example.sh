rm -rf conjure-output

parallel -j1 --eta --no-notice "conjure solve sumfree.essence {1}.param --channelling=no -aai --responses {2} --copy-solutions=no ; mv conjure-output/*.stats.json {1}-{2}.stats.json ; rm -rf conjure-output" \
    ::: dense sparse \
    ::: 1 2

jq -r '[input_filename, .totalTime] | join("\t")' *.stats.json

jq -r '[input_filename, .savilerowInfo.SolverTotalTime] | join("\t")' *.stats.json

