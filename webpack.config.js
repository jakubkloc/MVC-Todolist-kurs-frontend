const path = require("path");
const webpack = require("webpack");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const CopyPlugin = require("copy-webpack-plugin");

// zmienna określająca czy aplikacja jest odpalona lokalnie (development) (konfiguracja webpacka z "dist") czy aplikacja jest odpalona na github pages (production) (konfiguracja webpacka z "docs")
const environment =
	process.env.NODE_ENV === "production" ? "production" : "development";

// ścieżki do wynikowych katalogów 	
const outputDir = {
	production: "docs",
	development: "dist",
};

// zdefiniowanie url do których aplikacja ma wykonywać zapytania w zależności od tego czy jest na produkcji czy na developmencie 
const apiUrls = {
	production: "https://todo-backend-tutorial.herokuapp.com",
	development: "http://127.0.0.1:8888",
};

module.exports = {
	mode: "development",
	entry: "./src/app.js",
	module: {
		rules: [
			{
				test: /\.css$/i,
				use: ["style-loader", "css-loader"],
			},
		],
	},
	plugins: [
		new HtmlWebpackPlugin({
			template: "index.html",
		}),
		new CopyPlugin({
			patterns: [{ from: "assets", to: "assets" }],
		}),
		
		// zdefiniowanie zmiennej globalnej API_URL we wszystkich plikach w projekcie (domyślnie webpack traktuje wartość tych zmiennych globalnych jako kod więc użyliśmy JSON.stringify() aby zmienna API_URL przechowywała stringa). Zmienna ta jest użytwa w endpointach funkcji fetch w pliku store.js
		new webpack.DefinePlugin({
			API_URL: JSON.stringify(apiUrls[environment]),
		}),
	],
	output: {
		filename: "main.js",
		// w poniższej lini outputDir[enviroment] ma wartość "docs" albo "dist" w zależności od tego czy do kompilacji uzyliśmy npm run build/start czy npm run release
		path: path.resolve(__dirname, outputDir[environment]),
	},
};
