let db;

const request= indexedDB.open("budget", 1);

request.onupgradeneeded= function(event){
  const db= event.target.result;
  db.createObjectStore('newBudget');
};

request.onsuccess= function(event){
  db= event.target.result;
  
  if(navigator.onLine){
    uploadBudget();
  }
};

request.onerror= function(event){
  console.log(event.target.errorCode);
};

function saveRecord(record) {
  const transaction= db.transaction(['newBudget'], 'readwrite');

  const budgetObjectStore= transaction.objectStore('newBudget');

  budgetObjectStore.add(record);
}

function uploadBudget() {
  // open a transaction on your pending db
  const transaction= db.transaction(['newBudget'], 'readwrite');

  // access your pending object store
  const budgetObjectStore= transaction.objectStore('newBudget');

  // get all records from store and set to a variable
  const getAll= budgetObjectStore.getAll();

  getAll.onsuccess= function() {
    // if there was data in indexedDb's store, let's send it to the api server
    if (getAll.result.length > 0) {
      fetch('/api/transaction', {
        method: 'POST',
        body: JSON.stringify(getAll.result),
        headers: {
          Accept: 'application/json, text/plain, */*',
          'Content-Type': 'application/json'
        }
      })
        .then(response => response.json())
        .then(serverResponse => {
          if (serverResponse.message) {
            throw new Error(serverResponse);
          }

          const transaction = db.transaction(['newBudget'], 'readwrite');
          const budgetObjectStore = transaction.objectStore('newBudget');
          // clear all items in your store
          budgetObjectStore.clear();
        })
        .catch(err => {
          // set reference to redirect back here
          console.log(err);
        });
    }
  };
}

window.addEventListener('online', uploadBudget);

