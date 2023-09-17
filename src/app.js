import "../node_modules/todomvc-common/base.css";
import "../node_modules/todomvc-app-css/index.css";
import "../node_modules/todomvc-common/base.js";

import Controller from "./controller";
import { $on } from "./helpers";
import Template from "./template";
import Store from "./store";
import View from "./view";

const store = new Store("todos-vanilla-es6", () => {
	// ponieważ pobranie danych z backendu w Storze jest asynchroniczne i zajmuje czas to cały kod z tworzneiem instancji klasy View i Template itd. został przeniesiony na callbacka funkcji Store któy wykonuje się po pobraniu danych z backendu
	const template = new Template();
	const view = new View(template);
	view.setLoaderVisibility(false);

	/**
	 * @type {Controller}
	 */
	const controller = new Controller(store, view);

	const setView = () => controller.setView(document.location.hash);

	// po przeniesieniu do callbacka ten kod wykona się po zdarzeniu load więc trzeba bezpośrednio wykonać funckje setView()
	setView();
	$on(window, "load", setView);
	$on(window, "hashchange", setView);
});
