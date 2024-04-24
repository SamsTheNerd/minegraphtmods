import networkx as nx
import numpy as np
import scipy as sp
import scipy.cluster.vq as vq
import matplotlib.pyplot as plt
import math
import random
import operator
from networkx import graph_atlas_g
from os import listdir


# Read in graph file
G = nx.read_edgelist("./computedData/dependency_graph.data", comments="%", create_using=nx.DiGraph)

scale = 0.5

for f in listdir("./data/cfmeta"):
    modid = f.split(".json")[0]
    if modid not in G:
        G.add_node(modid)

for n in G:
    G.nodes[n]["image"] = f'./data/images/{n}.png'
    G.nodes[n]["imagescale"] = True
    G.nodes[n]["fixedsize"] = True
    G.nodes[n]["shape"] = "rectangle"
    # G.in_degree(n)
    if(G.in_degree(n) == 0):
        G.nodes[n]["width"] = 1 * scale
        G.nodes[n]["height"] = 1 * scale
    elif(G.in_degree(n) < 5):
        G.nodes[n]["width"] = 1.5 * scale
        G.nodes[n]["height"] = 1.5 * scale
    elif(G.in_degree(n) < 15):
        G.nodes[n]["width"] = 2 * scale
        G.nodes[n]["height"] = 2 * scale
    elif(G.in_degree(n) > 50):
        G.nodes[n]["width"] = 4 * scale
        G.nodes[n]["height"] = 4 * scale
    else:
        G.nodes[n]["width"] = 2.5 * scale
        G.nodes[n]["height"] = 2.5 * scale

for e in G.edges:
    dtype = G.edges[e]["dtype"]
    if dtype == 2:
        G.edges[e]["style"] = "dashed"
    elif dtype != 3:
        G.edges[e]["style"] = "dotted"


A = nx.nx_agraph.to_agraph(G)
A.graph_attr["overlap"] = "false"
# A.graph_attr["nodesep"] = 2
# A.graph_attr["ranksep"] = 1
# A.graph_attr["overlap_scaling"] = 10
A.draw("./pythongraphs/dependency_graph.png", prog="sfdp")

# nx.draw(G, pos=nx.spring_layout(G))

# plt.show()