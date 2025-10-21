import pandas as pd
file_path = 'data/global-data-on-sustainable-energy (1).csv'

df = pd.read_csv(file_path, sep=',')
#print("First 5 Rows (Head)")
#print(df.head())
#print("Last 5 Rows (Tail)")
#print(df.tail())

# print("\n Basic Info")
# df.info()

print(f"{df['Entity'].nunique()} different countries")


print("Number of Rows and Columns")
num_rows, num_cols = df.shape
print(f"Total rows: {num_rows}")
print(f"Total columns: {num_cols}")


# print("Column Names")
# print(df.columns.tolist())

# pd.set_option('display.max_columns', None)   
# pd.set_option('display.width', None)         
# pd.set_option('display.max_colwidth', None)  

# Now print the full describe table
print("Descriptive Statistics (All 21 Columns)")
#print(df.describe(include='all'))
df.describe(include='all').to_csv("descriptive.csv")
print("Full descriptive statistics")


# print("Missing Values")
# missing_values = df.isnull().sum()
# missing_values = missing_values[missing_values > 0].sort_values(ascending=False)
# if not missing_values.empty:
#     print(missing_values.head(10)) # Show top 10 columns with missing values
# else:
#     print("No missing values found in any column.")