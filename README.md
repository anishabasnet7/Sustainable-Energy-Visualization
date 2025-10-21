# Sustainable Energy Visualization
A data visualization project exploring global trends in sustainable energy. 
This project uses open datasets to provide clear, interactive insights of essential aspects like energy access, renewables, and carbon emissions, allowing cross-country comparisons.

## Features 
- Interactive charts

## Data Source
We use the **Global Data on Sustainable Energy** dataset from Kaggle:  
[https://www.kaggle.com/datasets/anshtanwar/global-data-on-sustainable-energy]

## Tech Stack
- Python  
- Pandas  
- Matplotlib / Plotly  

## Goal
Not set for now

## Installation & Usage
1. Clone this repository
git clone https://github.com/anishabasnet7/Sustainable-Energy-Visualization.git

## Local setup

1. Install the Kaggle API (if you want to download programmatically):
```shell
pip install kaggle
```
2. Place your Kaggle API key (kaggle.json) in the .kaggle folder in your home directory:
```shell
mkdir -p ~/.kaggle
mv /path/to/kaggle.json ~/.kaggle/
chmod 600 ~/.kaggle/kaggle.json
```
3. Download and unzip the dataset:
```shell
kaggle datasets download -d anshtanwar/global-data-on-sustainable-energy -p data/
unzip data/global-data-on-sustainable-energy.zip -d data/
```
