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
G = nx.read_weighted_edgelist("./computedData/mc_mp_graph_flat.data", comments="%", create_using=nx.Graph)

scale = 0.5

T = nx.Graph() # thresholded graph

for n in G:
    T.add_node(n)

THRESHOLD_ANY = 0.05
THRESHOLD_VIS = 0.001

for n in T:
    n_edges = list(G.edges(n, data=True))
    sorted_edges = sorted(n_edges, key = lambda x: x[2]['weight'], reverse =True)
    thr_val = max(math.ceil(THRESHOLD_ANY * len(n_edges)), min(len(n_edges), 15))
    vis_thr_val = math.ceil(THRESHOLD_VIS * len(n_edges))
    # print(f'{len(n_edges)} original edges. {thr_val} threshold')
    for e in range(0, thr_val):
        if not T.has_edge(sorted_edges[e][0], sorted_edges[e][1]):
            T.add_edge(sorted_edges[e][0], sorted_edges[e][1], weight=sorted_edges[e][2]['weight'] * 1000)
            if e <= vis_thr_val:
                T[sorted_edges[e][0]][sorted_edges[e][1]]['style'] = ""
            else: 
                T[sorted_edges[e][0]][sorted_edges[e][1]]['style'] = "invis"



# for u, v in T.edges():
#     T[u][v]['weight'] *= 100

# for n in T:
#     n_edges = list(T.edges(n, data=True))
#     sorted_edges = sorted(n_edges, key = lambda x: x[2]['weight'], reverse =True)
#     thr_val = math.ceil(THRESHOLD * len(n_edges))
#     # print(f'{len(n_edges)} original edges. {thr_val} threshold')
#     for e in range(0, thr_val):
#         T[sorted_edges[e][0]][sorted_edges[e][1]]['style'] = ""
#         # if not T.has_edge(sorted_edges[e][0], sorted_edges[e][1]):
#         #     T.add_edge(sorted_edges[e][0], sorted_edges[e][1], weight=sorted_edges[e][2]['weight'] * 1000)




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
A.edge_attr["style"] = "invis"
A.graph_attr["overlap"] = "false"
A.graph_attr["outputorder"] = "edgesfirst"
# A.graph_attr["splines"] = "true"
# A.graph_attr["nodesep"] = 2
# A.graph_attr["ranksep"] = 1
# A.graph_attr["overlap_scaling"] = 10

A.draw("./pythongraphs/mp_graph_thresholded.png", prog="sfdp")

# nx.draw(G, pos=nx.spring_layout(G))

# plt.show()