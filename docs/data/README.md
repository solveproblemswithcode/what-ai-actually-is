# How the chapter 7 radar numbers were made

`radar_groups.py` prints, for each kind of work, how much AI could do in theory and how much it is actually used for, weighted by how many people do each job. Those numbers are in `RADAR` in `src/scene/shapes.ts`.

Put these three public files in a `downloads/` folder next to the script, then run `python3 radar_groups.py`:

- `job_exposure.csv`: actual use, from Anthropic's Economic Index, https://huggingface.co/datasets/Anthropic/EconomicIndex (folder `labor_market_impacts`)
- `occ_level.csv`: what is possible in theory (`dv_rating_beta`), from Eloundou et al. 2023, https://github.com/openai/GPTs-are-GPTs (folder `data`)
- `national.csv`: employment per job, `national_May2021_dl.csv` from the same GitHub folder, renamed

Anthropic's report (Figure 2) uses a slightly different method, so its percentages are higher. The pattern is the same.
