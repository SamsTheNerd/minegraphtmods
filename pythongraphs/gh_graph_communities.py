import networkx as nx
import numpy as np
import scipy as sp
import scipy.cluster.vq as vq
import matplotlib.pyplot as plt
import math
import random
import operator
from networkx import graph_atlas_g
import json


# Read in graph file
G = nx.read_weighted_edgelist("./computedData/mc_gh_graph_flat.data", comments="%", create_using=nx.Graph)

def getModName(modid):
    file = open(f'./data/cfmeta/{modid}.json')
    cfm = json.load(file)
    name = cfm['name']
    file.close()
    return name


comms = nx.community.louvain_communities(G)
print(f'found {len(comms)} communities')
count = 0
for c in comms:
    print(f'community {count}: {[getModName(modid) for modid in c]}\n\n')
    count += 1