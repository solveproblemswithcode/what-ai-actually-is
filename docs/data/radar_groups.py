import csv, collections, sys
import os
# Put the three source files in a downloads/ folder next to this script (see README.md here).
d=os.path.join(os.path.dirname(os.path.abspath(__file__)), 'downloads') + '/'
emp={}
for r in csv.DictReader(open(d+'national.csv', encoding='utf-8-sig')):
    if r['O_GROUP']=='detailed':
        try: emp[r['OCC_CODE']]=float(r['TOT_EMP'].replace(',',''))
        except: pass
obs={r['occ_code']:float(r['observed_exposure']) for r in csv.DictReader(open(d+'job_exposure.csv'))}
beta=collections.defaultdict(list)
for r in csv.DictReader(open(d+'occ_level.csv')):
    beta[r['O*NET-SOC Code'][:7]].append(float(r['dv_rating_beta']))
beta={k:sum(v)/len(v) for k,v in beta.items()}
names={"11":"Management","13":"Business & finance","15":"Computer & math","17":"Architecture & engineering","19":"Life & social sciences","21":"Social services","23":"Legal","25":"Education & library","27":"Arts & media","29":"Healthcare practitioners","31":"Healthcare support","33":"Protective service","35":"Food & serving","37":"Grounds maintenance","39":"Personal care","41":"Sales","43":"Office & admin","45":"Agriculture","47":"Construction","49":"Installation & repair","51":"Production","53":"Transportation"}
acc=collections.defaultdict(lambda:[0,0,0,0])
for code,w in emp.items():
    g=code[:2]
    if code in obs: acc[g][0]+=obs[code]*w; acc[g][1]+=w
    if code in beta: acc[g][2]+=beta[code]*w; acc[g][3]+=w
rows=[]
for g,(o,ow,b,bw) in acc.items():
    if g in names and ow and bw: rows.append((names[g], b/bw, o/ow))
for n,b,o in sorted(rows,key=lambda x:-x[1]): print(f"{n:28s} theoretical {b:5.2f}   observed {o:5.2f}")
