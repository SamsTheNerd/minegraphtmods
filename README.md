# Minegrapht Modding

Minegrapht was my final project for my Graph Mining course. The goal was to scrape Minecraft mod data to be able to create graphs with mods as nodes and edges as some measure of relatedness.

## Data & Graphs

You can find all of the raw scraped data in [data](data) and some cool graph renders in [demos](demos). 

Most of the transformed graph data is available in [computedData](computedData), although some of it was quite large so you'll have to build it yourself using the scripts in [datamaking](datamaking). 

If you'd like to interact with the data from TypeScript/JavaScript, there's some wrapper code for it in [scraping](scraping), along with the rest of the scraper code.

## Paper & Presentation

If you'd like to know more about the project check out the [write up](paper/paper.pdf) or a shorter video presentation: 

[![thumbnail and link for the presentation video](https://img.youtube.com/vi/r5T0yxO3ZNQ/maxresdefault.jpg)](https://www.youtube.com/watch?v=r5T0yxO3ZNQ)

## GitHub user lookup

As a side effect of scraping lots of github data, there's a [script](demos/userinfo.ts) that can show you all the past activity a github user has had in modding repos.

## Using the data

Feel free to use any of this ! If you're doing something cool with it I'd love to see it ! Or if you need help with any of it feel free to get in touch, you can find me in most of the big modding discords.