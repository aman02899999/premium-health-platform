import csv, json
rows = {r['code']: r for r in csv.DictReader(open('compositions/index.csv'))}
def num(x):
    try: return float(x)
    except: return 0.0
# USDA SR Legacy rows: fdc, kcal, p, c, f, fib, ca, fe, na, k  (per 100 g, from FoodData_Central_sr_legacy_food_csv_2018-04)
USDA = {
 'oats':(173904,379,13.15,67.7,6.52,10.1,52,4.25,6,362,'Cereals, oats, regular and quick, not fortified, dry'),
 'curd':(171284,61,3.47,4.66,3.25,0,121,0.05,46,155,'Yogurt, plain, whole milk'),
 'greekYogurt':(170894,59,10.19,3.6,0.39,0,110,0.07,36,141,'Yogurt, Greek, plain, nonfat'),
 'tofu':(172475,144,17.27,2.78,8.72,2.3,683,2.66,14,237,'Tofu, raw, firm, prepared with calcium sulfate'),
 'soyaChunks':(174275,327,51.46,33.92,1.22,17.5,241,9.24,20,2384,'Soy flour, defatted'),
 'peanutButter':(172470,598,22.21,22.31,51.36,5.0,49,1.74,17,558,'Peanut butter, smooth style, without salt'),
 'chia':(170554,486,16.54,42.12,30.74,34.4,631,7.72,16,407,'Seeds, chia seeds, dried'),
 'pumpkinSeed':(170556,559,30.23,10.71,49.05,6.0,46,8.82,7,809,'Seeds, pumpkin and squash seed kernels, dried'),
 'oliveOil':(171413,884,0,0,100,0,1,0.56,2,1,'Oil, olive, salad or cooking'),
 'chickenBreast':(171477,165,31.02,0,3.57,0,15,1.04,74,256,'Chicken, broilers or fryers, breast, meat only, cooked, roasted'),
 'milkLowFat':(171267,50,3.3,4.8,1.98,0,120,0.02,47,140,'Milk, reduced fat, fluid, 2% milkfat, with added vitamin A and vitamin D'),
 'milkSkim':(171269,34,3.37,4.96,0.08,0,122,0.03,42,156,'Milk, nonfat, fluid, with added vitamin A and vitamin D (fat free or skim)'),
 'buttermilk':(170874,40,3.31,4.79,1.07,0,116,0.05,148,151,'Milk, buttermilk, fluid, cultured, lowfat'),
 'salmon':(175168,206,22.1,0,12.35,0,15,0.34,61,384,'Fish, salmon, Atlantic, farmed, cooked, dry heat'),
 'tuna':(173709,86,19.44,0,0.96,0,17,1.63,247,179,'Fish, tuna, light, canned in water, drained solids'),
 'prawns':(175180,99,23.98,0.2,0.28,0,70,0.51,111,259,'Crustaceans, shrimp, cooked'),
 'broccoli':(170379,34,2.82,6.64,0.37,2.6,47,0.73,33,316,'Broccoli, raw'),
 'sprouts':(169957,30,3.04,5.94,0.18,1.8,13,0.91,6,149,'Mung beans, mature seeds, sprouted, raw'),
 'breadWholeWheat':(172688,252,12.45,42.71,3.5,6.0,161,2.47,455,254,'Bread, whole-wheat, commercially prepared'),
}
# id: (name, source, diet, allergens, jainOk, role, unit, state, hint)
SPEC = [
 # grains (raw dry weight)
 ('atta','Whole-wheat atta (for roti/phulka)','A019','veg0','gluten',1,'carb','g','dry','~30 g atta makes 1 phulka'),
 ('riceWhite','Rice, white (raw)','A015','veg0','',1,'carb','g','dry','weigh before cooking'),
 ('riceBrown','Rice, brown (raw)','A013','veg0','',1,'carb','g','dry','weigh before cooking'),
 ('poha','Poha / rice flakes (dry)','A011','veg0','',1,'carb','g','dry',''),
 ('suji','Suji / semolina (dry)','A022','veg0','gluten',1,'carb','g','dry',''),
 ('ragi','Ragi flour / finger millet (dry)','A010','veg0','',1,'carb','g','dry',''),
 ('jowar','Jowar / sorghum (dry)','A005','veg0','',1,'carb','g','dry',''),
 ('bajra','Bajra / pearl millet (dry)','A003','veg0','',1,'carb','g','dry',''),
 ('quinoa','Quinoa (dry)','A009','veg0','',1,'carb','g','dry',''),
 ('oats','Rolled oats (dry)','oats','veg0','gluten',1,'carb','g','dry',''),
 ('breadWholeWheat','Whole-wheat bread','breadWholeWheat','veg0','gluten',1,'carb','g','ready','1 slice ≈ 30 g'),
 # dals & legumes (raw dry)
 ('moongDal','Moong dal (raw)','B010','veg0','',1,'legume','g','dry','weigh before cooking'),
 ('masoorDal','Masoor dal (raw)','B013','veg0','',1,'legume','g','dry','weigh before cooking'),
 ('toorDal','Toor / arhar dal (raw)','B021','veg0','',1,'legume','g','dry','weigh before cooking'),
 ('chanaDal','Chana dal (raw)','B001','veg0','',1,'legume','g','dry','weigh before cooking'),
 ('rajma','Rajma, red (raw)','B020','veg0','',1,'legume','g','dry','soak overnight; weigh dry'),
 ('kalaChana','Kala chana, whole (raw)','B002','veg0','',1,'legume','g','dry','soak overnight; weigh dry'),
 ('sprouts','Moong sprouts','sprouts','veg0','',1,'legume','g','raw',''),
 ('soyaChunks','Soya chunks (dry)','soyaChunks','veg0','soy',1,'protein','g','dry','USDA defatted soy flour used as reference'),
 ('tofu','Tofu, firm','tofu','veg0','soy',1,'protein','g','raw',''),
 # dairy
 ('paneer','Paneer','L003','veg1','dairy',1,'protein','g','raw',''),
 ('curd','Curd / dahi (whole milk)','curd','veg1','dairy',1,'dairy','g','ready','1 katori ≈ 150 g'),
 ('greekYogurt','Hung curd / Greek yogurt (fat-free)','greekYogurt','veg1','dairy',1,'protein','g','ready',''),
 ('milkCow','Cow milk, whole','L002','veg1','dairy',1,'dairy','ml','ready','1 glass ≈ 250 ml'),
 ('milkLowFat','Milk, low-fat (2%)','milkLowFat','veg1','dairy',1,'dairy','ml','ready','1 glass ≈ 250 ml'),
 ('milkSkim','Milk, skimmed','milkSkim','veg1','dairy',1,'dairy','ml','ready','1 glass ≈ 250 ml'),
 ('buttermilk','Chaas / buttermilk (low-fat)','buttermilk','veg1','dairy',1,'dairy','ml','ready','1 glass ≈ 250 ml'),
 # eggs
 ('egg','Egg, whole (boiled)','M004','egg','egg',0,'protein','g','cooked','1 egg ≈ 50 g edible'),
 ('eggWhite','Egg white (boiled)','M005','egg','egg',0,'protein','g','cooked','1 egg white ≈ 33 g'),
 # meat & fish
 ('chickenBreast','Chicken breast (cooked, skinless)','chickenBreast','nonveg','',0,'protein','g','cooked','weigh after cooking'),
 ('goatLeg','Mutton / goat leg (raw, lean)','O003','nonveg','',0,'protein','g','raw','weigh raw'),
 ('rohu','Rohu fish (raw)','S006','nonveg','fish',0,'protein','g','raw','weigh raw'),
 ('salmon','Salmon (cooked)','salmon','nonveg','fish',0,'protein','g','cooked',''),
 ('tuna','Tuna, canned in water (drained)','tuna','nonveg','fish',0,'protein','g','ready',''),
 ('prawns','Prawns / shrimp (cooked)','prawns','nonveg','shellfish',0,'protein','g','cooked',''),
 # fats, nuts, seeds
 ('ghee','Ghee','T013','veg1','dairy',1,'fat','g','ready','1 tsp ≈ 5 g'),
 ('mustardOil','Mustard oil','T006','veg0','',1,'fat','g','ready','1 tsp ≈ 5 g'),
 ('groundnutOil','Groundnut oil','T005','veg0','peanut',1,'fat','g','ready','1 tsp ≈ 5 g'),
 ('oliveOil','Olive oil','oliveOil','veg0','',1,'fat','g','ready','1 tsp ≈ 5 g'),
 ('almonds','Almonds','H001','veg0','nuts',1,'fat','g','raw','~10 almonds ≈ 12 g'),
 ('walnuts','Walnuts','H021','veg0','nuts',1,'fat','g','raw',''),
 ('peanuts','Peanuts / groundnut','H012','veg0','peanut',1,'fat','g','raw',''),
 ('peanutButter','Peanut butter (unsweetened)','peanutButter','veg0','peanut',1,'fat','g','ready','1 tbsp ≈ 16 g'),
 ('flaxseed','Flaxseed / alsi','H014','veg0','',1,'fat','g','raw','1 tbsp ≈ 10 g'),
 ('chia','Chia seeds','chia','veg0','',1,'fat','g','raw','1 tbsp ≈ 12 g'),
 ('pumpkinSeed','Pumpkin seeds','pumpkinSeed','veg0','',1,'fat','g','raw',''),
 ('sesame','Sesame / til (white)','H011','veg0','sesame',1,'fat','g','raw',''),
 # vegetables
 ('spinach','Spinach / palak','C033','veg0','',1,'veg','g','raw',''),
 ('cucumber','Cucumber','D043','veg0','',1,'veg','g','raw',''),
 ('tomato','Tomato, ripe','D075','veg0','',1,'veg','g','raw',''),
 ('cauliflower','Cauliflower','D036','veg0','',1,'veg','g','raw',''),
 ('cabbage','Cabbage','C015','veg0','',1,'veg','g','raw',''),
 ('carrot','Carrot','F002','veg0','',0,'veg','g','raw',''),
 ('capsicum','Capsicum, green','D033','veg0','',1,'veg','g','raw',''),
 ('lauki','Lauki / bottle gourd','D007','veg0','',1,'veg','g','raw',''),
 ('beans','French beans','D050','veg0','',1,'veg','g','raw',''),
 ('brinjal','Brinjal','D031','veg0','',1,'veg','g','raw',''),
 ('broccoli','Broccoli','broccoli','veg0','',1,'veg','g','raw',''),
 ('onion','Onion','G017','veg0','',0,'veg','g','raw',''),
 ('mushroom','Button mushroom','J001','veg0','',1,'veg','g','raw',''),
 ('peas','Green peas, fresh','D061','veg0','',1,'veg','g','raw',''),
 ('potato','Potato','F006','veg0','',0,'carb','g','raw',''),
 ('sweetPotato','Sweet potato','F013','veg0','',0,'carb','g','raw',''),
 # fruit
 ('banana','Banana','E012','veg0','',1,'fruit','g','raw','1 medium ≈ 100 g edible'),
 ('apple','Apple','E001','veg0','',1,'fruit','g','raw','1 medium ≈ 150 g'),
 ('papaya','Papaya, ripe','E049','veg0','',1,'fruit','g','raw',''),
 ('guava','Guava','E028','veg0','',1,'fruit','g','raw',''),
 ('orange','Orange','E047','veg0','',1,'fruit','g','raw',''),
 ('pomegranate','Pomegranate','E055','veg0','',1,'fruit','g','raw',''),
 ('dates','Dates, dry','E018','veg0','',1,'fruit','g','dry','1 date ≈ 8 g'),
]
DIET={'veg0':'vegan','veg1':'veg','egg':'egg','nonveg':'nonveg'}
out=[]
for (id_,name,src,diet,allergen,jain,role,unit,state,hint) in SPEC:
    if src in USDA:
        fdc,kcal,p,c,f,fib,ca,fe,na,k,desc = USDA[src]
        source={'db':'USDA','ref':str(fdc),'desc':desc}
    else:
        r=rows[src]; kj=num(r['enerc'])
        p,f,c,fib=num(r['protcnt']),num(r['fatce']),num(r['choavldf']),num(r['fibtg'])
        if kj<=0: kj=37*f+17*p+17*c+8*fib  # IFCT energy factors (oils have no reported energy)
        kcal=kj/4.184
        ca,fe,na,k=[1000*num(r[x]) for x in ('ca','fe','na','k')]  # IFCT stores minerals in g/100 g
        source={'db':'IFCT','ref':src,'desc':r['name']}
    out.append(dict(id=id_,name=name,kcal=round(kcal,1),p=round(p,2),c=round(c,2),f=round(f,2),fib=round(fib,2),ca=round(ca,1),fe=round(fe,2),na=round(na,1),k=round(k,1),diet=DIET[diet],allergen=allergen or None,jain=bool(jain),role=role,unit=unit,state=state,hint=hint or None,source=source))
ts=["// AUTO-GENERATED by a one-off script from official food-composition tables. Do not edit numbers by hand.",
"// Values are per 100 g (or 100 ml) edible portion.",
"//  - IFCT 2017: Indian Food Composition Tables, ICMR-National Institute of Nutrition, Hyderabad (code = IFCT food code).",
"//    Energy = reported ENERC (kJ) / 4.184; oils/ghee have no reported energy, so 37 kJ/g fat is used (IFCT factor).",
"//  - USDA: FoodData Central, SR Legacy release (April 2018), fdc.nal.usda.gov (ref = FDC ID).",
"// Minerals in mg (IFCT stores g/100 g; converted). Cooked/raw state is part of each food's name; plans weigh food in that state.",
"import type { FoodItem } from './types';","",
"export const FOOD_DB: FoodItem[] = ["]
for o in out:
    ts.append("  "+json.dumps(o,ensure_ascii=False)+",")
ts.append("];")
open('/home/user/premium-health-platform/src/lib/diet-pro/foods.ts','w').write("\n".join(ts)+"\n")
for o in out: print(o['id'],o['kcal'],o['p'],o['c'],o['f'],o['ca'],o['fe'],o['na'])
