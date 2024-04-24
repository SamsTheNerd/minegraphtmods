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

scale = 2

def getModName(modid):
    file = open(f'./data/cfmeta/{modid}.json')
    cfm = json.load(file)
    name = cfm['name']
    file.close()
    return name

# T = nx.Graph() # thresholded graph

# hex_neighborhood = { '569849': 0 } # hex 

# neighborhood_queue = [ '569849' ]

# steps = 1

# while(len(neighborhood_queue) > 0):
#     nextMod = neighborhood_queue.pop(0)
#     if nextMod in hex_neighborhood and hex_neighborhood[nextMod] != 0:
#         continue
#     for nb in G.neighbors(nextMod):
#         if nb in hex_neighborhood:
#             continue
#         hex_neighborhood[nb] = hex_neighborhood[nextMod] + 1
#         print(f'added {getModName(nb)}')
#         if hex_neighborhood[nextMod] < steps:
#             neighborhood_queue.append(nb)

hex_neighborhood = [nb for nb in G.neighbors('897558')]
hex_neighborhood.append('897558')

print(f'added {len(hex_neighborhood)} neighbors')

H = G.subgraph([node for node in hex_neighborhood])

T = nx.Graph()

for n in H:
    T.add_node(n)

THRESHOLD = 0.05

for n in T:
    n_edges = list(H.edges(n, data=True))
    sorted_edges = sorted(n_edges, key = lambda x: x[2]['weight'] / (H.degree(x[1]) + H.degree(x[0])), reverse =True)
    thr_val = math.ceil(THRESHOLD * len(n_edges))
    # print(f'{len(n_edges)} original edges. {thr_val} threshold')
    for e in range(0, thr_val):
        if not T.has_edge(sorted_edges[e][0], sorted_edges[e][1]):
            T.add_edge(sorted_edges[e][0], sorted_edges[e][1], weight=sorted_edges[e][2]['weight'] / (H.degree(sorted_edges[e][1]) + H.degree(sorted_edges[e][0])))

print(f'{len(T.edges)} edges')

for n in T:
    T.nodes[n]["image"] = f'./data/images/{n}.png'
    T.nodes[n]["imagescale"] = True
    T.nodes[n]["fixedsize"] = True
    T.nodes[n]["shape"] = "rectangle"
    # G.in_degree(n)
    # if(G.degree(n) == 0):
    T.nodes[n]["width"] = 1 * scale
    T.nodes[n]["height"] = 1 * scale
    # elif(G.in_degree(n) < 5):
    #     G.nodes[n]["width"] = 1.5 * scale
    #     G.nodes[n]["height"] = 1.5 * scale
    # elif(G.in_degree(n) < 15):
    #     G.nodes[n]["width"] = 2 * scale
    #     G.nodes[n]["height"] = 2 * scale
    # elif(G.in_degree(n) > 50):
    #     G.nodes[n]["width"] = 4 * scale
    #     G.nodes[n]["height"] = 4 * scale
    # else:
    #     G.nodes[n]["width"] = 2.5 * scale
    #     G.nodes[n]["height"] = 2.5 * scale


A = nx.nx_agraph.to_agraph(T)
A.graph_attr["overlap"] = "false"
# A.graph_attr["splines"] = "true"
# A.graph_attr["nodesep"] = 2
# A.graph_attr["ranksep"] = 1
# A.graph_attr["overlap_scaling"] = 10

A.draw("./pythongraphs/gh_gloopgraph_thresholded_normalized.png", prog="sfdp")

# nx.draw(G, pos=nx.spring_layout(G))

# plt.show()