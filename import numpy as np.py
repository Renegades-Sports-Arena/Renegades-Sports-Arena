import numpy as np
import pandas as pd

data=pd.read_csv(r"")
c=np.array(data.iloc[:,0:-1])
t=np.array(data.iloc[:,-1])
print(c)
print(t)

def learn(c,t):
    PI=[c[i] for i in range (len(c)) if t[i]=='yes']
    sh=PI[0].copy()
    gh=[['?'for _ in range (len(sh))] for _ in range (len(sh))]
    print(sh)
    print(gh)


