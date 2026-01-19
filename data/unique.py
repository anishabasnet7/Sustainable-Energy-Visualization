import pandas as pd
df = pd.read_csv("processed_data.csv")
unique_countries = sorted(df["country"].dropna().unique())
num_unique = df["country"].nunique()
print(num_unique)
for c in unique_countries:
    print(c)
   