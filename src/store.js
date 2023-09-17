import { Item, ItemList, ItemQuery, ItemUpdate, emptyItemQuery } from "./item";

// wysyłanie zapisanego zadania do serwera na backendzie 
function sendItemToBackEnd(item) {
	return fetch(`${API_URL}/todos`, {
		method: "POST",
		// zamiana obiektu na obiekt JSON ( w innym przypadku do serwera na backendzie wysyłany byłby string)
		body: JSON.stringify(item),
		headers: {
			 // nagłówek który określa jakiego typu dane są wysyłane w body aby serwer wiedział jak je sparsować
			"Content-type": "application/json",
		},
	});
}

// funcja pobierająca stan aplikacji z backendu
function getItemsFromBackEnd() {
	// zwraca wynik zapytania GET (domyslny typ dla fetcha) do adresu ".../todos" następnie po odebraniu promisa jest wywoływana nim metoda obiektu res.json() któa po rozwiązaniu promisa przekształca JSON na JS (nie mylić z metodą expressa res.json() która przekształca obiet JS na JSON przed wysłaniem z backendu) 
	return fetch(`${API_URL}/todos`).then((res) => res.json());
}

// funkcja do usuwania zadania z bazy backend
function deleteItemFromBackEnd(item) {
	// wykonuje zapytanie typu DELETE (służace do usuwania) na adres '.../todos/id_zadania
	return fetch(`${API_URL}/todos/${item.id}`, {
		method: "DELETE",
	});
}

// funckja do aktualizacji zadań
function patchItemToBackEnd(update) {
	// wysłanie zapytania typu PATCH (wiemy tylko co się zmieniło i id do indentyfikacji)
	return fetch(`${API_URL}/todos/${update.id}`, {
		method: "PATCH",
		// przekształcenie na ciąg znakó JSON
		body: JSON.stringify(update),
		// nagłówek informujacy jak odczytać body zapytania
		headers: {
			"Content-type": "application/json",
		},
	});
}

export default class Store {
	/**
	 * @param {!string} name Database name
	 * @param {function()} [callback] Called when the Store is ready
	 */
	constructor(name, callback) {
		/**
		 * @type {Storage}
		 */
		const localStorage = window.localStorage;

		/**
		 * @type {ItemList}
		 */
		let liveTodos;

		/**
		 * Read the local ItemList from localStorage.
		 *
		 * @returns {ItemList} Current array of todos
		 */
		this.getLocalStorage = () => {
			if (!liveTodos) {
				liveTodos = [];
			}
			return liveTodos;
		};

		/**
		 * Write the local ItemList to localStorage.
		 *
		 * @param {ItemList} todos Array of todos to write
		 */
		this.setLocalStorage = (todos) => {
			liveTodos = todos;
		};

		// wywołanie funkcji getItemsFromBackEnd w konksturkorze 
		// zdestrukturyzowanie pola todoList 
		getItemsFromBackEnd().then(({ todoList }) => {
			// zapisanie w zmiennej 's' aktualnie zapiasnych w aplikacji zadań
			const s = this.getLocalStorage();
			// dodanie do zmiennej 's' zadań pobranych z backendu
			// do zmiennej s przypisane jest odowłanie do tablicy do której odowłuje sie, też liveTodos więc zmieniajac obiekt z referencją przypidsaną do s zmieniamy także obiekt którego referencja znajduje się w zmiennej liveTodos 
			todoList.forEach((todoItem) => {
				s.push(todoItem);
			});

			// wywołanie callbacka zostało przeniesione na koniec funkcji getItemsFromBackEnd ponieważ dzięki temu wywoła się dopiero po pobraniu danych z backendu
			if (callback) {
				callback();
			}
		});
	}

	/**
	 * Find items with properties matching those on query.
	 *
	 * @param {ItemQuery} query Query to match
	 * @param {function(ItemList)} callback Called when the query is done
	 *
	 * @example
	 * db.find({completed: true}, data => {
	 *	 // data shall contain items whose completed properties are true
	 * })
	 */
	find(query, callback) {
		const todos = this.getLocalStorage();
		let k;

		callback(
			todos.filter((todo) => {
				for (k in query) {
					if (query[k] !== todo[k]) {
						return false;
					}
				}
				return true;
			})
		);
	}

	/**
	 * Update an item in the Store.
	 *
	 * @param {ItemUpdate} update Record with an id and a property to update
	 * @param {function()} [callback] Called when partialRecord is applied
	 */
	update(update, callback) {
		const id = update.id;
		const todos = this.getLocalStorage();
		let i = todos.length;
		let k;

		while (i--) {
			if (todos[i].id === id) {
				for (k in update) {
					todos[i][k] = update[k];
				}
				break;
			}
		}

		this.setLocalStorage(todos);

		// wywołanie funkcji aktualizując baze danych na backendzie
		patchItemToBackEnd(update).then(() => {
			if (callback) {
				callback();
			}
		});
	}

	/**
	 * Insert an item into the Store.
	 *
	 * @param {Item} item Item to insert
	 * @param {function()} [callback] Called when item is inserted
	 */
	insert(item, callback) {
		const todos = this.getLocalStorage();
		todos.push(item);
		this.setLocalStorage(todos);

		sendItemToBackEnd(item).then(() => {
			if (callback) {
				callback();
			}
		});
	}

	/**
	 * Remove items from the Store based on a query.
	 *
	 * @param {ItemQuery} query Query matching the items to remove
	 * @param {function(ItemList)|function()} [callback] Called when records matching query are removed
	 */
	remove(query, callback) {
		let k;

		const promises = [];

		const todos = this.getLocalStorage().filter((todo) => {
			// pętla for ...in podstawia kolejne klucze obiektu qurey odczytując wartości i porównuje je z wartościami dla tych samych kluczy z obiektu todo
			// jeśli wartości są rózne to zwracane jest true i zadanie zostaje w tablicy todos, jeśli wartości są takie same to jest wykonywany promises.push(deleteItemFromBackend(todo)) który usuwa dane zadanie z bazy danych na backendzie i dodaje promisa do tablicy promisów
			for (k in query) {
				if (query[k] !== todo[k]) {
					return true;
				}
			}

			promises.push(deleteItemFromBackEnd(todo));
			return false;
		});

		// aktualizuje się stan listy zadań przekazująć przefiltrowane todos do setLocalStorage
		this.setLocalStorage(todos);

		Promise.all(promises).then(() => {
			if (callback) {
				callback(todos);
			}
		});
	}

	/**
	 * Count total, active, and completed todos.
	 *
	 * @param {function(number, number, number)} callback Called when the count is completed
	 */
	count(callback) {
		this.find(emptyItemQuery, (data) => {
			const total = data.length;

			let i = total;
			let completed = 0;

			while (i--) {
				completed += data[i].completed;
			}
			callback(total, total - completed, completed);
		});
	}
}
