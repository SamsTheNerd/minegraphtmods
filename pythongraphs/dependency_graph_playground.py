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
G = nx.read_weighted_edgelist("./computedData/dependency_graph.data", comments="%", create_using=nx.DiGraph)

A = nx.nx_agraph.to_agraph(G)
A.graph_attr["overlap"] = "compress"
A.graph_attr["nodesep"] = 1
A.graph_attr["ranksep"] = 2
A.draw("./pythongraphs/dependency_graph.svg", prog="dot")

# nx.draw(G, pos=nx.spring_layout(G))

# plt.show()