import networkx as nx
import numpy as np
import scipy as sp
import scipy.cluster.vq as vq
import matplotlib.pyplot as plt
import math
import random
import operator
from networkx import graph_atlas_g


# Read in graph file
G = nx.read_weighted_edgelist("./computedData/mc_gh_graph_flat.data", comments="%", create_using=nx.Graph)

scale = 0.5

T = nx.Graph() # thresholded graph

for n in G:
    T.add_node(n)

THRESHOLD = 0.01

for n in T:
    n_edges = list(G.edges(n, data=True))
    sorted_edges = sorted(n_edges, key = lambda x: x[2]['weight'] / G.degree(x[1]), reverse =True)
    thr_val = math.ceil(THRESHOLD * len(n_edges))
    # print(f'{len(n_edges)} original edges. {thr_val} threshold')
    for e in range(0, thr_val):
        if not T.has_edge(sorted_edges[e][0], sorted_edges[e][1]):
            T.add_edge(sorted_edges[e][0], sorted_edges[e][1], weight=sorted_edges[e][2]['weight'])

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

A.draw("./pythongraphs/gh_graph_flat_scaledthresholded.png", prog="sfdp")

# nx.draw(G, pos=nx.spring_layout(G))

# plt.show()